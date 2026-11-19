package mapper

import (
	"hrgo/backend/internal/modules/workspace/position/models"
	"hrgo/backend/internal/modules/workspace/position/response"
)

func ToPositionResponse(p *models.Position) response.PositionResponse {
	return response.PositionResponse{
		ID:             p.ID,
		OrganizationID: p.OrganizationID,
		DepartmentID:   p.DepartmentID,
		PositionCode:   p.Code,
		PositionName:   p.Name,
		Status:         p.Status,
	}
}

func ToPositionList(positions []models.Position) []response.PositionResponse {
	res := make([]response.PositionResponse, 0, len(positions))
	for i := range positions {
		res = append(res, ToPositionResponse(&positions[i]))
	}
	return res
}
