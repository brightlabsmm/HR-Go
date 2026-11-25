package request

type CreateOvertimeCategoryRequest struct {
	Code                string  `json:"code" binding:"required,max=30"`
	Name                string  `json:"name" binding:"required,max=100"`
	Description         *string `json:"description"`
	RateMultiplier      float64 `json:"rateMultiplier" binding:"gte=1,lte=10"`
	MinMinutes          int     `json:"minMinutes" binding:"gte=0"`
	MaxDailyMinutes     int     `json:"maxDailyMinutes" binding:"gte=30,lte=1440"`
	RequiresPreApproval *bool   `json:"requiresPreApproval"`
}

type CreateOvertimeRequest struct {
	EmployeeID         string `json:"employeeId"`
	OvertimeCategoryID string `json:"overtimeCategoryId" binding:"required"`
	WorkDate           string `json:"workDate" binding:"required"`
	StartTime          string `json:"startTime" binding:"required"`
	EndTime            string `json:"endTime" binding:"required"`
	Reason             string `json:"reason" binding:"required"`
}

type ReviewOvertimeRequest struct {
	Decision string  `json:"decision" binding:"required"`
	Remarks  *string `json:"remarks"`
}

type ListOvertimeRequestsQuery struct {
	Page       int    `form:"page,default=1" binding:"omitempty,min=1"`
	PageSize   int    `form:"pageSize,default=20" binding:"omitempty,min=1,max=100"`
	Status     string `form:"status"`
	EmployeeID string `form:"employeeId"`
}
