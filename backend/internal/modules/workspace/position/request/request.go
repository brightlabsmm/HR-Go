package request

import (
	"hrgo/backend/internal/shared/filtering"
	"hrgo/backend/internal/shared/sorting"
)

type CreatePositionRequest struct {
	PositionCode string  `json:"positionCode" binding:"required"`
	PositionName string  `json:"positionName" binding:"required"`
	DepartmentID *string `json:"departmentId"`
}

type UpdatePositionRequest struct {
	PositionName *string `json:"positionName"`
	DepartmentID *string `json:"departmentId"`
}

type ListPositionsQuery struct {
	Q            string  `form:"q"`
	DepartmentID *string `form:"departmentId"`
	Status       string  `form:"status"`
	Page         int     `form:"page,default=1"`
	PageSize     int     `form:"pageSize,default=20"`
	sorting.Query
	filtering.Params
}
