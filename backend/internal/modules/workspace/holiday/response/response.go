package response

import "time"

type HolidayResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	BranchID       *string   `json:"branchId,omitempty"`
	BranchName     *string   `json:"branchName,omitempty"`
	HolidayName    string    `json:"holidayName"`
	StartDate      string    `json:"startDate"`
	EndDate        string    `json:"endDate"`
	HolidayType    string    `json:"holidayType"`
	IsPaid         bool      `json:"isPaid"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type HolidayListResponse struct {
	Items      []HolidayResponse `json:"items"`
	Pagination PaginationMeta    `json:"pagination"`
}

type CalendarHolidayItem struct {
	ID          string  `json:"id"`
	HolidayName string  `json:"holidayName"`
	StartDate   string  `json:"startDate"`
	EndDate     string  `json:"endDate"`
	HolidayType string  `json:"holidayType"`
	IsPaid      bool    `json:"isPaid"`
	BranchID    *string `json:"branchId,omitempty"`
	BranchName  *string `json:"branchName,omitempty"`
}

type CalendarResponse struct {
	Year     int                   `json:"year"`
	Month    *int                  `json:"month,omitempty"`
	BranchID *string               `json:"branchId,omitempty"`
	Holidays []CalendarHolidayItem `json:"holidays"`
}

type PaginationMeta struct {
	Total       int64 `json:"total"`
	Page        int   `json:"page"`
	PageSize    int   `json:"pageSize"`
	TotalPages  int   `json:"totalPages"`
	HasNextPage bool  `json:"hasNextPage"`
	HasPrevPage bool  `json:"hasPrevPage"`
}
