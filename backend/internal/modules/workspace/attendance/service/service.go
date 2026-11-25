package service

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"
	_ "time/tzdata"

	"hrgo/backend/internal/modules/workspace/attendance/mapper"
	"hrgo/backend/internal/modules/workspace/attendance/models"
	"hrgo/backend/internal/modules/workspace/attendance/repository"
	"hrgo/backend/internal/modules/workspace/attendance/request"
	"hrgo/backend/internal/modules/workspace/attendance/response"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	CheckIn(ctx context.Context, orgID string, req request.CheckInRequest) (*response.AttendanceResponse, *apperrors.Error)
	CheckOut(ctx context.Context, orgID string, req request.CheckOutRequest) (*response.AttendanceResponse, *apperrors.Error)
	ManualEntry(ctx context.Context, orgID string, req request.ManualAttendanceRequest) (*response.AttendanceResponse, *apperrors.Error)
	GetRecordByID(ctx context.Context, orgID, id string) (*response.AttendanceResponse, *apperrors.Error)
	ListRecords(ctx context.Context, orgID string, q request.ListAttendanceQuery) (*response.AttendanceListResponse, *apperrors.Error)
	GetSummary(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*response.AttendanceSummaryResponse, *apperrors.Error)

	SubmitCorrection(ctx context.Context, orgID string, req request.CreateCorrectionRequest) (*response.CorrectionResponse, *apperrors.Error)
	GetCorrectionByID(ctx context.Context, orgID, id string) (*response.CorrectionResponse, *apperrors.Error)
	ListCorrections(ctx context.Context, orgID string, q request.ListCorrectionsQuery) (*response.CorrectionListResponse, *apperrors.Error)
	ReviewCorrection(ctx context.Context, orgID, reviewerAccountID, id string, req request.ReviewCorrectionRequest) (*response.CorrectionResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) CheckIn(ctx context.Context, orgID string, req request.CheckInRequest) (*response.AttendanceResponse, *apperrors.Error) {
	empOK, err := s.repo.ValidateEmployee(ctx, orgID, req.EmployeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if !empOK {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "employeeId", Message: "Employee was not found in this organization."},
		})
	}

	loc := s.resolveOrgLocation(ctx, orgID)
	checkInTime := time.Now().UTC()
	if req.CheckInTime != nil && strings.TrimSpace(*req.CheckInTime) != "" {
		t, parseErr := mapper.ParseDateTime(*req.CheckInTime)
		if parseErr != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "checkInTime", Message: "Invalid check-in time format, expected RFC3339."},
			})
		}
		checkInTime = t.UTC()
	}

	localIn := checkInTime.In(loc)
	attendanceDate := time.Date(localIn.Year(), localIn.Month(), localIn.Day(), 0, 0, 0, 0, time.UTC)

	record, err := s.repo.FindRecordByDate(ctx, orgID, req.EmployeeID, attendanceDate)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record != nil && record.CheckIn != nil {
		return nil, apperrors.BadRequest("Employee has already checked in for today.")
	}

	if record == nil {
		record = &models.AttendanceRecord{
			OrganizationID: orgID,
			EmployeeID:     req.EmployeeID,
			AttendanceDate: attendanceDate,
		}
	}

	record.CheckIn = &checkInTime
	source := "WEB"
	if req.Source != nil && strings.TrimSpace(*req.Source) != "" {
		source = strings.ToUpper(strings.TrimSpace(*req.Source))
	}
	record.Source = source
	if req.Remarks != nil {
		record.Remarks = req.Remarks
	}

	var shift *shiftmodels.Shift
	if req.ShiftID != nil && strings.TrimSpace(*req.ShiftID) != "" {
		shift, err = s.repo.FindShiftByID(ctx, orgID, strings.TrimSpace(*req.ShiftID))
		if err != nil {
			return nil, apperrors.Internal()
		}
		if shift == nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "shiftId", Message: "Selected shift was not found in this organization or is inactive."},
			})
		}
		record.ShiftID = &shift.ID
	} else {
		shift, _ = s.repo.GetAssignedShift(ctx, orgID, req.EmployeeID, attendanceDate)
		if shift != nil {
			record.ShiftID = &shift.ID
		}
	}

	grace, _ := s.repo.GetGracePeriodMinutes(ctx, orgID)
	record.AttendanceStatus = "PRESENT"
	if shift != nil && shift.StartTime != "" {
		record.LateMinutes = calculateLateMinutes(checkInTime, shift.StartTime, loc, grace)
		if record.LateMinutes > 0 {
			record.AttendanceStatus = "LATE"
		}
	}

	if err := s.repo.SaveAttendance(ctx, record); err != nil {
		return nil, apperrors.Internal()
	}

	saved, err := s.repo.FindRecordByID(ctx, orgID, record.ID)
	if err != nil || saved == nil {
		res := mapper.ToAttendanceResponse(record)
		return &res, nil
	}

	res := mapper.ToAttendanceResponse(saved)
	return &res, nil
}

func (s *service) CheckOut(ctx context.Context, orgID string, req request.CheckOutRequest) (*response.AttendanceResponse, *apperrors.Error) {
	empOK, err := s.repo.ValidateEmployee(ctx, orgID, req.EmployeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if !empOK {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "employeeId", Message: "Employee was not found in this organization."},
		})
	}

	loc := s.resolveOrgLocation(ctx, orgID)
	checkOutTime := time.Now().UTC()
	if req.CheckOutTime != nil && strings.TrimSpace(*req.CheckOutTime) != "" {
		t, parseErr := mapper.ParseDateTime(*req.CheckOutTime)
		if parseErr != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "checkOutTime", Message: "Invalid check-out time format, expected RFC3339."},
			})
		}
		checkOutTime = t.UTC()
	}

	localOut := checkOutTime.In(loc)
	attendanceDate := time.Date(localOut.Year(), localOut.Month(), localOut.Day(), 0, 0, 0, 0, time.UTC)

	record, err := s.repo.FindRecordByDate(ctx, orgID, req.EmployeeID, attendanceDate)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record == nil || record.CheckIn == nil {
		return nil, apperrors.BadRequest("Cannot check out without a previous check-in for today.")
	}
	if record.CheckOut != nil {
		return nil, apperrors.Conflict("Employee has already checked out for today.")
	}
	if checkOutTime.Before(*record.CheckIn) {
		return nil, apperrors.BadRequest("Check-out time cannot be before check-in time.")
	}

	record.CheckOut = &checkOutTime
	if req.Remarks != nil {
		record.Remarks = req.Remarks
	}

	var shift *shiftmodels.Shift
	if record.ShiftID != nil && *record.ShiftID != "" {
		shift, _ = s.repo.FindShiftByID(ctx, orgID, *record.ShiftID)
	}
	if shift == nil {
		shift, _ = s.repo.GetAssignedShift(ctx, orgID, req.EmployeeID, attendanceDate)
	}

	worked, earlyLeave := computeWorkMetrics(record.CheckIn, record.CheckOut, shift, loc)
	record.WorkedMinutes = worked
	record.EarlyLeaveMinutes = earlyLeave
	if earlyLeave > 0 && record.AttendanceStatus == "PRESENT" {
		record.AttendanceStatus = "EARLY_LEAVE"
	}

	if err := s.repo.SaveAttendance(ctx, record); err != nil {
		return nil, apperrors.Internal()
	}

	saved, err := s.repo.FindRecordByID(ctx, orgID, record.ID)
	if err != nil || saved == nil {
		res := mapper.ToAttendanceResponse(record)
		return &res, nil
	}

	res := mapper.ToAttendanceResponse(saved)
	return &res, nil
}

func (s *service) ManualEntry(ctx context.Context, orgID string, req request.ManualAttendanceRequest) (*response.AttendanceResponse, *apperrors.Error) {
	empOK, err := s.repo.ValidateEmployee(ctx, orgID, req.EmployeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if !empOK {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "employeeId", Message: "Employee was not found in this organization."},
		})
	}

	date, err := mapper.ParseDate(req.AttendanceDate)
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "attendanceDate", Message: "Invalid attendance date format, expected YYYY-MM-DD."},
		})
	}

	var checkIn, checkOut *time.Time
	if req.CheckIn != nil && strings.TrimSpace(*req.CheckIn) != "" {
		t, parseErr := mapper.ParseDateTime(*req.CheckIn)
		if parseErr != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "checkIn", Message: "Invalid check-in time format, expected RFC3339."},
			})
		}
		utcT := t.UTC()
		checkIn = &utcT
	}

	if req.CheckOut != nil && strings.TrimSpace(*req.CheckOut) != "" {
		t, parseErr := mapper.ParseDateTime(*req.CheckOut)
		if parseErr != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "checkOut", Message: "Invalid check-out time format, expected RFC3339."},
			})
		}
		utcT := t.UTC()
		checkOut = &utcT
	}

	if checkIn != nil && checkOut != nil && checkOut.Before(*checkIn) {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "checkOut", Message: "Check-out time cannot be before check-in time."},
		})
	}

	var shift *shiftmodels.Shift
	var shiftID *string
	if req.ShiftID != nil && strings.TrimSpace(*req.ShiftID) != "" {
		shift, err = s.repo.FindShiftByID(ctx, orgID, strings.TrimSpace(*req.ShiftID))
		if err != nil {
			return nil, apperrors.Internal()
		}
		if shift == nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "shiftId", Message: "Selected shift was not found in this organization or is inactive."},
			})
		}
		shiftID = &shift.ID
	} else {
		shift, _ = s.repo.GetAssignedShift(ctx, orgID, req.EmployeeID, *date)
		if shift != nil {
			shiftID = &shift.ID
		}
	}

	loc := s.resolveOrgLocation(ctx, orgID)
	grace, _ := s.repo.GetGracePeriodMinutes(ctx, orgID)

	worked, earlyLeave := computeWorkMetrics(checkIn, checkOut, shift, loc)
	lateMinutes := 0
	if checkIn != nil && shift != nil && shift.StartTime != "" {
		lateMinutes = calculateLateMinutes(*checkIn, shift.StartTime, loc, grace)
	}

	status := "PRESENT"
	if req.AttendanceStatus != nil && *req.AttendanceStatus != "" {
		status = strings.ToUpper(strings.TrimSpace(*req.AttendanceStatus))
	} else if lateMinutes > 0 {
		status = "LATE"
	}

	record := models.AttendanceRecord{
		OrganizationID:    orgID,
		EmployeeID:        req.EmployeeID,
		ShiftID:           shiftID,
		AttendanceDate:    *date,
		CheckIn:           checkIn,
		CheckOut:          checkOut,
		AttendanceStatus:  status,
		LateMinutes:       lateMinutes,
		EarlyLeaveMinutes: earlyLeave,
		WorkedMinutes:     worked,
		Source:            "MANUAL",
		Remarks:           req.Remarks,
	}

	if err := s.repo.SaveAttendance(ctx, &record); err != nil {
		return nil, apperrors.Internal()
	}

	saved, err := s.repo.FindRecordByID(ctx, orgID, record.ID)
	if err != nil || saved == nil {
		res := mapper.ToAttendanceResponse(&record)
		return &res, nil
	}

	res := mapper.ToAttendanceResponse(saved)
	return &res, nil
}

func (s *service) GetRecordByID(ctx context.Context, orgID, id string) (*response.AttendanceResponse, *apperrors.Error) {
	record, err := s.repo.FindRecordByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record == nil {
		return nil, apperrors.NotFound("Attendance record not found.")
	}

	res := mapper.ToAttendanceResponse(record)
	return &res, nil
}

func (s *service) ListRecords(ctx context.Context, orgID string, q request.ListAttendanceQuery) (*response.AttendanceListResponse, *apperrors.Error) {
	items, total, err := s.repo.ListRecords(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &response.AttendanceListResponse{
		Items: mapper.ToAttendanceResponses(items),
		Pagination: response.PaginationMeta{
			Total:       total,
			Page:        page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			HasNextPage: page < totalPages,
			HasPrevPage: page > 1,
		},
	}, nil
}

func (s *service) GetSummary(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*response.AttendanceSummaryResponse, *apperrors.Error) {
	agg, err := s.repo.GetSummaryAggregate(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if agg == nil {
		agg = &repository.SummaryAggregate{}
	}

	return &response.AttendanceSummaryResponse{
		From:               q.From,
		To:                 q.To,
		TotalDays:          agg.TotalDays,
		PresentDays:        agg.PresentDays,
		LateDays:           agg.LateDays,
		AbsentDays:         agg.AbsentDays,
		HalfDays:           agg.HalfDays,
		TotalWorkedMinutes: agg.TotalWorkedMinutes,
		TotalLateMinutes:   agg.TotalLateMinutes,
	}, nil
}

func (s *service) SubmitCorrection(ctx context.Context, orgID string, req request.CreateCorrectionRequest) (*response.CorrectionResponse, *apperrors.Error) {
	empOK, err := s.repo.ValidateEmployee(ctx, orgID, req.EmployeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if !empOK {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "employeeId", Message: "Employee was not found in this organization."},
		})
	}

	date, err := mapper.ParseDate(req.AttendanceDate)
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "attendanceDate", Message: "Invalid attendance date format, expected YYYY-MM-DD."},
		})
	}

	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "reason", Message: "Reason for correction is required."},
		})
	}

	var reqCheckIn, reqCheckOut *time.Time
	if req.RequestedCheckIn != nil && strings.TrimSpace(*req.RequestedCheckIn) != "" {
		t, parseErr := mapper.ParseDateTime(*req.RequestedCheckIn)
		if parseErr != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "requestedCheckIn", Message: "Invalid requested check-in time format."},
			})
		}
		utcT := t.UTC()
		reqCheckIn = &utcT
	}

	if req.RequestedCheckOut != nil && strings.TrimSpace(*req.RequestedCheckOut) != "" {
		t, parseErr := mapper.ParseDateTime(*req.RequestedCheckOut)
		if parseErr != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "requestedCheckOut", Message: "Invalid requested check-out time format."},
			})
		}
		utcT := t.UTC()
		reqCheckOut = &utcT
	}

	if reqCheckIn == nil && reqCheckOut == nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "requestedCheckIn", Message: "At least one requested check-in or check-out time is required."},
		})
	}
	if reqCheckIn != nil && reqCheckOut != nil && reqCheckOut.Before(*reqCheckIn) {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "requestedCheckOut", Message: "Requested check-out time cannot be before check-in time."},
		})
	}

	if req.AttendanceID != nil && strings.TrimSpace(*req.AttendanceID) != "" {
		rec, findErr := s.repo.FindRecordByID(ctx, orgID, strings.TrimSpace(*req.AttendanceID))
		if findErr != nil {
			return nil, apperrors.Internal()
		}
		if rec == nil || rec.EmployeeID != req.EmployeeID {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "attendanceId", Message: "Referenced attendance record was not found for this employee."},
			})
		}
	}

	corr := models.AttendanceCorrectionRequest{
		OrganizationID:    orgID,
		AttendanceID:      req.AttendanceID,
		EmployeeID:        req.EmployeeID,
		AttendanceDate:    *date,
		RequestedCheckIn:  reqCheckIn,
		RequestedCheckOut: reqCheckOut,
		Reason:            reason,
		RequestStatus:     "PENDING",
	}

	if err := s.repo.CreateCorrection(ctx, &corr); err != nil {
		return nil, apperrors.Internal()
	}

	created, err := s.repo.FindCorrectionByID(ctx, orgID, corr.ID)
	if err != nil || created == nil {
		res := mapper.ToCorrectionResponse(&corr)
		return &res, nil
	}

	res := mapper.ToCorrectionResponse(created)
	return &res, nil
}

func (s *service) GetCorrectionByID(ctx context.Context, orgID, id string) (*response.CorrectionResponse, *apperrors.Error) {
	corr, err := s.repo.FindCorrectionByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if corr == nil {
		return nil, apperrors.NotFound("Correction request not found.")
	}

	res := mapper.ToCorrectionResponse(corr)
	return &res, nil
}

func (s *service) ListCorrections(ctx context.Context, orgID string, q request.ListCorrectionsQuery) (*response.CorrectionListResponse, *apperrors.Error) {
	items, total, err := s.repo.ListCorrections(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &response.CorrectionListResponse{
		Items: mapper.ToCorrectionResponses(items),
		Pagination: response.PaginationMeta{
			Total:       total,
			Page:        page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			HasNextPage: page < totalPages,
			HasPrevPage: page > 1,
		},
	}, nil
}

func (s *service) ReviewCorrection(ctx context.Context, orgID, reviewerAccountID, id string, req request.ReviewCorrectionRequest) (*response.CorrectionResponse, *apperrors.Error) {
	corr, err := s.repo.FindCorrectionByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if corr == nil {
		return nil, apperrors.NotFound("Correction request not found.")
	}

	if corr.RequestStatus != "PENDING" {
		return nil, apperrors.BadRequest("This correction request has already been reviewed.")
	}

	now := time.Now().UTC()
	decision := strings.ToUpper(strings.TrimSpace(req.Decision))
	corr.ReviewedByAccountID = &reviewerAccountID
	corr.ReviewedAt = &now

	if decision == "REJECTED" {
		if req.Reason == nil || strings.TrimSpace(*req.Reason) == "" {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "reason", Message: "Rejection reason is required."},
			})
		}
		corr.RequestStatus = "REJECTED"
		corr.RejectionReason = req.Reason

		if err := s.repo.RejectCorrection(ctx, corr); err != nil {
			return nil, apperrors.Internal()
		}
	} else if decision == "APPROVED" {
		corr.RequestStatus = "APPROVED"
		corr.RejectionReason = req.Reason

		var existing *models.AttendanceRecord
		if corr.AttendanceID != nil && *corr.AttendanceID != "" {
			existing, _ = s.repo.FindRecordByID(ctx, orgID, *corr.AttendanceID)
		}
		if existing == nil {
			existing, _ = s.repo.FindRecordByDate(ctx, orgID, corr.EmployeeID, corr.AttendanceDate)
		}

		mergedCheckIn := corr.RequestedCheckIn
		mergedCheckOut := corr.RequestedCheckOut
		var shiftID *string
		if existing != nil {
			if mergedCheckIn == nil {
				mergedCheckIn = existing.CheckIn
			}
			if mergedCheckOut == nil {
				mergedCheckOut = existing.CheckOut
			}
			shiftID = existing.ShiftID
		}

		if mergedCheckIn != nil && mergedCheckOut != nil && mergedCheckOut.Before(*mergedCheckIn) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "decision", Message: "Approved check-out time cannot be earlier than check-in time."},
			})
		}

		var shift *shiftmodels.Shift
		if shiftID != nil && *shiftID != "" {
			shift, _ = s.repo.FindShiftByID(ctx, orgID, *shiftID)
		}
		if shift == nil {
			shift, _ = s.repo.GetAssignedShift(ctx, orgID, corr.EmployeeID, corr.AttendanceDate)
			if shift != nil {
				shiftID = &shift.ID
			}
		}

		loc := s.resolveOrgLocation(ctx, orgID)
		grace, _ := s.repo.GetGracePeriodMinutes(ctx, orgID)
		worked, earlyLeave := computeWorkMetrics(mergedCheckIn, mergedCheckOut, shift, loc)
		lateMinutes := 0
		if mergedCheckIn != nil && shift != nil && shift.StartTime != "" {
			lateMinutes = calculateLateMinutes(*mergedCheckIn, shift.StartTime, loc, grace)
		}

		status := "PRESENT"
		if lateMinutes > 0 {
			status = "LATE"
		} else if earlyLeave > 0 {
			status = "EARLY_LEAVE"
		}

		record := models.AttendanceRecord{
			OrganizationID:    orgID,
			EmployeeID:        corr.EmployeeID,
			ShiftID:           shiftID,
			AttendanceDate:    corr.AttendanceDate,
			CheckIn:           mergedCheckIn,
			CheckOut:          mergedCheckOut,
			AttendanceStatus:  status,
			LateMinutes:       lateMinutes,
			EarlyLeaveMinutes: earlyLeave,
			WorkedMinutes:     worked,
			Source:            "MANUAL",
			Remarks:           &corr.Reason,
		}

		if err := s.repo.ApproveCorrection(ctx, corr, &record); err != nil {
			return nil, apperrors.Internal()
		}
	}

	updated, err := s.repo.FindCorrectionByID(ctx, orgID, id)
	if err != nil || updated == nil {
		res := mapper.ToCorrectionResponse(corr)
		return &res, nil
	}

	res := mapper.ToCorrectionResponse(updated)
	return &res, nil
}

func (s *service) resolveOrgLocation(ctx context.Context, orgID string) *time.Location {
	tz, err := s.repo.GetOrgTimezone(ctx, orgID)
	if err != nil || strings.TrimSpace(tz) == "" {
		return time.UTC
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return time.UTC
	}
	return loc
}

func computeWorkMetrics(checkIn, checkOut *time.Time, shift *shiftmodels.Shift, loc *time.Location) (int, int) {
	if checkIn == nil || checkOut == nil {
		return 0, 0
	}
	diff := checkOut.Sub(*checkIn)
	worked := int(diff.Minutes())
	if worked < 0 {
		worked = 0
	}
	earlyLeave := 0
	if shift != nil {
		if shift.BreakMinutes > 0 && worked > shift.BreakMinutes {
			worked -= shift.BreakMinutes
		}
		if shift.EndTime != "" {
			earlyLeave = calculateEarlyLeaveMinutes(*checkOut, shift.EndTime, loc)
		}
	}
	return worked, earlyLeave
}

func calculateLateMinutes(checkInUTC time.Time, shiftStart string, loc *time.Location, graceMinutes int) int {
	parts := strings.Split(shiftStart, ":")
	if len(parts) != 2 {
		return 0
	}
	var sh, sm int
	_, _ = fmt.Sscanf(parts[0], "%d", &sh)
	_, _ = fmt.Sscanf(parts[1], "%d", &sm)

	localIn := checkInUTC.In(loc)
	shiftStartTime := time.Date(localIn.Year(), localIn.Month(), localIn.Day(), sh, sm, 0, 0, loc)
	allowedTime := shiftStartTime.Add(time.Duration(graceMinutes) * time.Minute)
	if localIn.After(allowedTime) {
		return int(localIn.Sub(shiftStartTime).Minutes())
	}
	return 0
}

func calculateEarlyLeaveMinutes(checkOutUTC time.Time, shiftEnd string, loc *time.Location) int {
	parts := strings.Split(shiftEnd, ":")
	if len(parts) != 2 {
		return 0
	}
	var sh, sm int
	_, _ = fmt.Sscanf(parts[0], "%d", &sh)
	_, _ = fmt.Sscanf(parts[1], "%d", &sm)

	localOut := checkOutUTC.In(loc)
	shiftEndTime := time.Date(localOut.Year(), localOut.Month(), localOut.Day(), sh, sm, 0, 0, loc)
	if localOut.Before(shiftEndTime) {
		return int(shiftEndTime.Sub(localOut).Minutes())
	}
	return 0
}
