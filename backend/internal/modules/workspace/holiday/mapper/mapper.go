package mapper

import (
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/holiday/models"
	"hrgo/backend/internal/modules/workspace/holiday/response"
)

func ToHolidayResponse(h *models.Holiday) response.HolidayResponse {
	return response.HolidayResponse{
		ID:             h.ID,
		OrganizationID: h.OrganizationID,
		BranchID:       h.BranchID,
		BranchName:     nullableString(h.BranchName),
		HolidayName:    h.HolidayName,
		StartDate:      h.StartDate.Format("2006-01-02"),
		EndDate:        h.EndDate.Format("2006-01-02"),
		HolidayType:    h.HolidayType,
		IsPaid:         h.IsPaid,
		CreatedAt:      h.CreatedAt,
		UpdatedAt:      h.UpdatedAt,
	}
}

func ToHolidayResponses(items []models.Holiday) []response.HolidayResponse {
	result := make([]response.HolidayResponse, len(items))
	for i := range items {
		result[i] = ToHolidayResponse(&items[i])
	}
	return result
}

func ToCalendarHolidayItems(items []models.Holiday) []response.CalendarHolidayItem {
	result := make([]response.CalendarHolidayItem, len(items))
	for i := range items {
		result[i] = response.CalendarHolidayItem{
			ID:          items[i].ID,
			HolidayName: items[i].HolidayName,
			StartDate:   items[i].StartDate.Format("2006-01-02"),
			EndDate:     items[i].EndDate.Format("2006-01-02"),
			HolidayType: items[i].HolidayType,
			IsPaid:      items[i].IsPaid,
			BranchID:    items[i].BranchID,
			BranchName:  nullableString(items[i].BranchName),
		}
	}
	return result
}

func nullableString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func ParseDate(s string) (*time.Time, error) {
	t, err := time.Parse("2006-01-02", strings.TrimSpace(s))
	if err != nil {
		return nil, err
	}
	return &t, nil
}
