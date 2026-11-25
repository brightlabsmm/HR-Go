package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/attendanceimport/models"
	"hrgo/backend/internal/modules/workspace/attendanceimport/repository"
	"hrgo/backend/internal/modules/workspace/attendanceimport/request"
	"hrgo/backend/internal/modules/workspace/attendanceimport/response"
	"hrgo/backend/internal/shared/audit"
	apperrors "hrgo/backend/internal/shared/errors"
)

var validStatuses = map[string]bool{
	"PRESENT":     true,
	"LATE":        true,
	"ABSENT":      true,
	"HALF_DAY":    true,
	"EARLY_LEAVE": true,
	"ON_LEAVE":    true,
	"HOLIDAY":     true,
}

type Service interface {
	ImportCSV(ctx context.Context, orgID, accountID string, req request.ImportAttendanceCSVRequest, auditCtx audit.RecordInput) (*response.ImportBatchResponse, *apperrors.Error)
	ListBatches(ctx context.Context, orgID string, page, pageSize int) ([]response.ImportBatchResponse, int64, *apperrors.Error)
	ExportCSV(ctx context.Context, orgID string, q request.ExportAttendanceQuery) ([]byte, *apperrors.Error)
}

type svc struct {
	repo     repository.Repository
	recorder audit.Recorder
}

func New(repo repository.Repository, recorder audit.Recorder) Service {
	return &svc{repo: repo, recorder: recorder}
}

func (s *svc) ImportCSV(ctx context.Context, orgID, accountID string, req request.ImportAttendanceCSVRequest, auditCtx audit.RecordInput) (*response.ImportBatchResponse, *apperrors.Error) {
	reader := csv.NewReader(strings.NewReader(strings.TrimSpace(req.CSVContent)))
	reader.TrimLeadingSpace = true
	rows, err := reader.ReadAll()
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
			Field:   "csvContent",
			Message: "Unable to parse CSV format.",
		}})
	}
	if len(rows) < 2 {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
			Field:   "csvContent",
			Message: "CSV must include header row and at least one data row.",
		}})
	}

	headerIdx := make(map[string]int, len(rows[0]))
	for i, col := range rows[0] {
		key := strings.ToLower(strings.TrimSpace(strings.TrimPrefix(col, "\ufeff")))
		headerIdx[key] = i
	}
	if _, ok := headerIdx["employeecode"]; !ok {
		if _, okAlt := headerIdx["employee_code"]; !okAlt {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
				Field:   "csvContent",
				Message: "CSV header must include employeeCode and attendanceDate columns.",
			}})
		}
	}

	tzName := s.repo.GetOrgTimezone(ctx, orgID)
	loc, locErr := time.LoadLocation(tzName)
	if locErr != nil {
		loc = time.UTC
	}

	dataRows := rows[1:]
	var rowErrors []response.ImportBatchError
	successCount := 0
	empCache := make(map[string]string)

	for idx, row := range dataRows {
		rowNum := idx + 2
		empCode := colValue(row, headerIdx, "employeecode", "employee_code")
		dateStr := colValue(row, headerIdx, "attendancedate", "attendance_date")
		inStr := colValue(row, headerIdx, "checkin", "check_in")
		outStr := colValue(row, headerIdx, "checkout", "check_out")
		statusStr := strings.ToUpper(colValue(row, headerIdx, "status", "attendance_status"))
		remarksStr := colValue(row, headerIdx, "remarks", "notes")

		if empCode == "" || dateStr == "" {
			rowErrors = append(rowErrors, response.ImportBatchError{
				Row:     rowNum,
				Message: "employeeCode and attendanceDate are required",
			})
			continue
		}

		attDate, parseErr := time.Parse("2006-01-02", dateStr)
		if parseErr != nil {
			rowErrors = append(rowErrors, response.ImportBatchError{
				Row:     rowNum,
				Message: fmt.Sprintf("invalid attendanceDate %q", dateStr),
			})
			continue
		}

		empID, cached := empCache[empCode]
		if !cached {
			foundID, findErr := s.repo.FindEmployeeIDByCode(ctx, orgID, empCode)
			if findErr != nil {
				msg := "employee lookup failed"
				if findErr == gorm.ErrRecordNotFound {
					msg = fmt.Sprintf("employee %q not found in organization", empCode)
				}
				rowErrors = append(rowErrors, response.ImportBatchError{Row: rowNum, Message: msg})
				continue
			}
			empID = foundID
			empCache[empCode] = empID
		}

		if statusStr == "" {
			statusStr = "PRESENT"
		}
		if !validStatuses[statusStr] {
			rowErrors = append(rowErrors, response.ImportBatchError{
				Row:     rowNum,
				Message: fmt.Sprintf("invalid status %q", statusStr),
			})
			continue
		}

		inTime, inErr := parseDateOrClock(dateStr, inStr, loc)
		if inErr != nil {
			rowErrors = append(rowErrors, response.ImportBatchError{
				Row:     rowNum,
				Message: fmt.Sprintf("invalid checkIn %q", inStr),
			})
			continue
		}
		outTime, outErr := parseDateOrClock(dateStr, outStr, loc)
		if outErr != nil {
			rowErrors = append(rowErrors, response.ImportBatchError{
				Row:     rowNum,
				Message: fmt.Sprintf("invalid checkOut %q", outStr),
			})
			continue
		}

		worked := 0
		if inTime != nil && outTime != nil && outTime.After(*inTime) {
			worked = int(outTime.Sub(*inTime).Minutes())
		}

		var remarksPtr *string
		if remarksStr != "" {
			remarksPtr = &remarksStr
		}
		now := time.Now().UTC()
		rec := &repository.ImportRecordUpsert{
			OrganizationID:   orgID,
			EmployeeID:       empID,
			AttendanceDate:   attDate,
			CheckIn:          inTime,
			CheckOut:         outTime,
			AttendanceStatus: statusStr,
			WorkedMinutes:    worked,
			Source:           "CSV_IMPORT",
			Remarks:          remarksPtr,
			CreatedAt:        now,
			UpdatedAt:        now,
		}
		if upsertErr := s.repo.UpsertAttendanceRecord(ctx, rec); upsertErr != nil {
			rowErrors = append(rowErrors, response.ImportBatchError{
				Row:     rowNum,
				Message: "database upsert failed",
			})
			continue
		}
		successCount++
	}

	failedCount := len(dataRows) - successCount
	importStatus := "COMPLETED"
	if successCount == 0 && failedCount > 0 {
		importStatus = "FAILED"
	} else if failedCount > 0 {
		importStatus = "PARTIAL"
	}

	var errJSON json.RawMessage
	if len(rowErrors) > 0 {
		errJSON, _ = json.Marshal(rowErrors)
	}

	var actorPtr *string
	if accountID != "" {
		actorPtr = &accountID
	}
	now := time.Now().UTC()
	batch := &models.AttendanceImportBatch{
		OrganizationID:      orgID,
		ImportedByAccountID: actorPtr,
		FileReference:       strings.TrimSpace(req.FileReference),
		TotalRows:           len(dataRows),
		SuccessRows:         successCount,
		FailedRows:          failedCount,
		ImportStatus:        importStatus,
		ErrorSummary:        errJSON,
		CreatedAt:           now,
		UpdatedAt:           now,
	}
	if err := s.repo.CreateBatch(ctx, batch); err != nil {
		return nil, apperrors.Internal()
	}

	res := toBatchResp(*batch)
	if s.recorder != nil {
		auditCtx.OrganizationID = orgID
		auditCtx.Action = "IMPORT_ATTENDANCE_CSV"
		auditCtx.EntityName = "attendance_import_batches"
		auditCtx.EntityID = batch.ID
		auditCtx.NewValues = res
		_ = s.recorder.Record(ctx, auditCtx)
	}
	return &res, nil
}

func (s *svc) ListBatches(ctx context.Context, orgID string, page, pageSize int) ([]response.ImportBatchResponse, int64, *apperrors.Error) {
	rows, total, err := s.repo.ListBatches(ctx, orgID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.Internal()
	}
	out := make([]response.ImportBatchResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toBatchResp(r))
	}
	return out, total, nil
}

func (s *svc) ExportCSV(ctx context.Context, orgID string, q request.ExportAttendanceQuery) ([]byte, *apperrors.Error) {
	rows, err := s.repo.ListExportRows(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	_ = w.Write([]string{
		"employeeCode", "employeeName", "branch", "shift",
		"attendanceDate", "checkIn", "checkOut", "status",
		"lateMinutes", "earlyLeaveMinutes", "workedMinutes", "source", "remarks",
	})

	for _, r := range rows {
		checkInStr := ""
		if r.CheckIn != nil {
			checkInStr = r.CheckIn.UTC().Format(time.RFC3339)
		}
		checkOutStr := ""
		if r.CheckOut != nil {
			checkOutStr = r.CheckOut.UTC().Format(time.RFC3339)
		}
		_ = w.Write([]string{
			sanitizeCSVCell(r.EmployeeCode),
			sanitizeCSVCell(r.EmployeeName),
			sanitizeCSVCell(deref(r.BranchName)),
			sanitizeCSVCell(deref(r.ShiftName)),
			r.AttendanceDate.Format("2006-01-02"),
			checkInStr,
			checkOutStr,
			sanitizeCSVCell(r.AttendanceStatus),
			strconv.Itoa(r.LateMinutes),
			strconv.Itoa(r.EarlyLeaveMinutes),
			strconv.Itoa(r.WorkedMinutes),
			sanitizeCSVCell(r.Source),
			sanitizeCSVCell(deref(r.Remarks)),
		})
	}
	w.Flush()
	if err := w.Error(); err != nil {
		return nil, apperrors.Internal()
	}
	return buf.Bytes(), nil
}

func colValue(row []string, headerIdx map[string]int, keys ...string) string {
	for _, k := range keys {
		if idx, ok := headerIdx[k]; ok && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
	}
	return ""
}

func parseDateOrClock(dateStr, raw string, loc *time.Location) (*time.Time, error) {
	if raw == "" {
		return nil, nil
	}
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		utc := t.UTC()
		return &utc, nil
	}
	for _, layout := range []string{"15:04:05", "15:04"} {
		if parsed, err := time.ParseInLocation("2006-01-02 "+layout, dateStr+" "+raw, loc); err == nil {
			utc := parsed.UTC()
			return &utc, nil
		}
	}
	return nil, fmt.Errorf("invalid timestamp")
}

func sanitizeCSVCell(v string) string {
	if v == "" {
		return ""
	}
	switch v[0] {
	case '=', '+', '-', '@', '\t', '\r':
		return "'" + v
	default:
		return v
	}
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func toBatchResp(m models.AttendanceImportBatch) response.ImportBatchResponse {
	return response.ImportBatchResponse{
		ID:                  m.ID,
		OrganizationID:      m.OrganizationID,
		ImportedByAccountID: m.ImportedByAccountID,
		FileReference:       m.FileReference,
		TotalRows:           m.TotalRows,
		SuccessRows:         m.SuccessRows,
		FailedRows:          m.FailedRows,
		ImportStatus:        m.ImportStatus,
		ErrorSummary:        m.ErrorSummary,
		CreatedAt:           m.CreatedAt,
	}
}
