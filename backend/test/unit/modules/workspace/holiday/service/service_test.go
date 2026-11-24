package service_test

import (
	"context"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/holiday/models"
	"hrgo/backend/internal/modules/workspace/holiday/repository"
	"hrgo/backend/internal/modules/workspace/holiday/request"
	"hrgo/backend/internal/modules/workspace/holiday/service"
)

type mockHolidayRepo struct {
	repository.Repository
	holidays []models.Holiday
}

func (m *mockHolidayRepo) Create(ctx context.Context, h *models.Holiday) error {
	h.ID = "holiday-1"
	h.CreatedAt = time.Now().UTC()
	h.UpdatedAt = time.Now().UTC()
	m.holidays = append(m.holidays, *h)
	return nil
}

func (m *mockHolidayRepo) FindByID(ctx context.Context, orgID, id string) (*models.Holiday, error) {
	for i := range m.holidays {
		if m.holidays[i].ID == id {
			return &m.holidays[i], nil
		}
	}
	return nil, nil
}

func (m *mockHolidayRepo) List(ctx context.Context, orgID string, q request.ListHolidaysQuery) ([]models.Holiday, int64, error) {
	return m.holidays, int64(len(m.holidays)), nil
}

func (m *mockHolidayRepo) GetCalendarHolidays(ctx context.Context, orgID string, branchID string, from, to time.Time) ([]models.Holiday, error) {
	return m.holidays, nil
}

func TestHolidayService_CreateAndCalendar(t *testing.T) {
	repo := &mockHolidayRepo{}
	svc := service.New(repo)
	ctx := context.Background()

	isPaid := true
	holType := "PUBLIC"
	req := request.CreateHolidayRequest{
		HolidayName: "New Year's Day",
		StartDate:   "2026-01-01",
		EndDate:     "2026-01-01",
		HolidayType: &holType,
		IsPaid:      &isPaid,
	}

	res, err := svc.Create(ctx, "org-1", req)
	if err != nil {
		t.Fatalf("unexpected error creating holiday: %v", err)
	}
	if res.HolidayName != "New Year's Day" {
		t.Errorf("expected New Year's Day, got %s", res.HolidayName)
	}

	cal, err := svc.GetCalendar(ctx, "org-1", request.HolidayCalendarQuery{Year: 2026})
	if err != nil {
		t.Fatalf("unexpected error getting calendar: %v", err)
	}
	if len(cal.Holidays) != 1 {
		t.Errorf("expected 1 holiday, got %d", len(cal.Holidays))
	}
}
