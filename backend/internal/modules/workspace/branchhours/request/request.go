package request

type OperatingHourItem struct {
	DayOfWeek   string  `json:"dayOfWeek" binding:"required"`
	OpeningTime *string `json:"openingTime"`
	ClosingTime *string `json:"closingTime"`
	IsClosed    bool    `json:"isClosed"`
}

type UpsertBranchOperatingHoursRequest struct {
	Hours []OperatingHourItem `json:"hours" binding:"required,min=1,max=7,dive"`
}
