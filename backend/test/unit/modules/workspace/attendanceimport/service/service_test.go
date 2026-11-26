package service_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/attendanceimport/models"
	"hrgo/backend/internal/modules/workspace/attendanceimport/repository"
	"hrgo/backend/internal/modules/workspace/attendanceimport/request"
	"hrgo/backend/internal/modules/workspace/attendanceimport/service"
	"hrgo/backend/internal/shared/audit"
)

type fakeImportRepo struct {
	employees  map[string]string
	upserted   []repository.ImportRecordUpsert
	batches    []models.AttendanceImportBatch
	exportRows []repository.ExportRow
}

func (f *fakeImportRepo) GetOrgTimezone(_ context.Context, _ string) string { return "Asia/Yangon" }
func (f *fakeImportRepo) FindEmployeeIDByCode(_ context.Context, _, code string) (string, error) {
	if id, ok := f.employees[code]; ok {
		return id, nil
	}
	return "", gorm.ErrRecordNotFound
}
func (f *fakeImportRepo) UpsertAttendanceRecord(_ context.Context, rec *repository.ImportRecordUpsert) error {
	f.upserted = append(f.upserted, *rec)
	return nil
}
func (f *fakeImportRepo) CreateBatch(_ context.Context, batch *models.AttendanceImportBatch) error {
	batch.ID = "batch-1"
	f.batches = append(f.batches, *batch)
	return nil
}
func (f *fakeImportRepo) ListBatches(_ context.Context, _ string, _, _ int) ([]models.AttendanceImportBatch, int64, error) {
	return f.batches, int64(len(f.batches)), nil
}
func (f *fakeImportRepo) ListExportRows(_ context.Context, _ string, _ request.ExportAttendanceQuery) ([]repository.ExportRow, error) {
	return f.exportRows, nil
}

func TestImportCSVAndExportFormulaSanitization(t *testing.T) {
	repo := &fakeImportRepo{
		employees: map[string]string{"EMP-001": "emp-uuid-1"},
		exportRows: []repository.ExportRow{{
			EmployeeCode:     "EMP-001",
			EmployeeName:     "=CMD|'/C calc'!A0",
			AttendanceDate:   time.Date(2026, 11, 20, 0, 0, 0, 0, time.UTC),
			AttendanceStatus: "PRESENT",
			WorkedMinutes:    480,
			Source:           "CSV_IMPORT",
		}},
	}
	svc := service.New(repo, nil)

	res, appErr := svc.ImportCSV(context.Background(), "org-1", "acc-1", request.ImportAttendanceCSVRequest{
		FileReference: "nov-import.csv",
		CSVContent: "employeeCode,attendanceDate,checkIn,checkOut,status,remarks\n" +
			"EMP-001,2026-11-20,09:00,17:30,PRESENT,On time\n" +
			"EMP-999,2026-11-20,09:00,17:30,PRESENT,Missing user",
	}, audit.RecordInput{ActorID: "acc-1"})
	if appErr != nil {
		t.Fatalf("unexpected error: %+v", appErr)
	}
	if res.TotalRows != 2 || res.SuccessRows != 1 || res.FailedRows != 1 || res.ImportStatus != "PARTIAL" {
		t.Fatalf("unexpected batch result: %+v", res)
	}
	if len(repo.upserted) != 1 || repo.upserted[0].WorkedMinutes != 510 {
		t.Fatalf("expected 510 worked minutes, got %+v", repo.upserted)
	}

	csvBytes, appErr := svc.ExportCSV(context.Background(), "org-1", request.ExportAttendanceQuery{})
	if appErr != nil {
		t.Fatalf("export error: %+v", appErr)
	}
	if !strings.Contains(string(csvBytes), "'=CMD") {
		t.Fatalf("expected CSV formula injection guard, got:\n%s", string(csvBytes))
	}

	_, missingHeaderErr := svc.ImportCSV(context.Background(), "org-1", "acc-1", request.ImportAttendanceCSVRequest{
		FileReference: "bad.csv",
		CSVContent:    "employeeCode,checkIn\nEMP-001,09:00",
	}, audit.RecordInput{ActorID: "acc-1"})
	if missingHeaderErr == nil {
		t.Fatalf("expected validation error when attendanceDate header is missing")
	}
}
