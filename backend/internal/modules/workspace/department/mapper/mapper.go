package mapper

import (
	"hrgo/backend/internal/modules/workspace/department/models"
	"hrgo/backend/internal/modules/workspace/department/response"
)

func ToDepartmentResponse(d *models.Department) response.DepartmentResponse {
	return response.DepartmentResponse{
		ID:             d.ID,
		OrganizationID: d.OrganizationID,
		BranchID:       d.BranchID,
		DepartmentCode: d.Code,
		DepartmentName: d.Name,
		Status:         d.Status,
	}
}

func ToDepartmentList(depts []models.Department) []response.DepartmentResponse {
	res := make([]response.DepartmentResponse, 0, len(depts))
	for i := range depts {
		res = append(res, ToDepartmentResponse(&depts[i]))
	}
	return res
}
