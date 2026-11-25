package request

type CreateHolidayRequest struct {
	HolidayName string  `json:"holidayName" binding:"required,max=150"`
	StartDate   string  `json:"startDate" binding:"required"` // YYYY-MM-DD
	EndDate     string  `json:"endDate" binding:"required"`   // YYYY-MM-DD
	BranchID    *string `json:"branchId" binding:"omitempty,uuid"`
	HolidayType *string `json:"holidayType" binding:"omitempty,oneof=PUBLIC COMPANY OPTIONAL"`
	IsPaid      *bool   `json:"isPaid"`
}

type UpdateHolidayRequest struct {
	HolidayName *string `json:"holidayName" binding:"omitempty,max=150"`
	StartDate   *string `json:"startDate"`
	EndDate     *string `json:"endDate"`
	BranchID    *string `json:"branchId" binding:"omitempty,uuid"`
	HolidayType *string `json:"holidayType" binding:"omitempty,oneof=PUBLIC COMPANY OPTIONAL"`
	IsPaid      *bool   `json:"isPaid"`
}

type ListHolidaysQuery struct {
	Year        int    `form:"year"`
	BranchID    string `form:"branchId"`
	StartDate   string `form:"startDate"`
	EndDate     string `form:"endDate"`
	HolidayType string `form:"holidayType"`
	Q           string `form:"q"`
	Page        int    `form:"page,default=1"`
	PageSize    int    `form:"pageSize,default=20"`
}

type HolidayCalendarQuery struct {
	Year     int    `form:"year" binding:"required"`
	Month    int    `form:"month"` // 1-12, optional (if 0 or omitted, whole year)
	BranchID string `form:"branchId"`
}
