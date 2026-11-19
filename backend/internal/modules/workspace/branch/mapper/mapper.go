package mapper

import (
	"hrgo/backend/internal/modules/workspace/branch/models"
	"hrgo/backend/internal/modules/workspace/branch/response"
)

func ToBranchResponse(b *models.Branch) response.BranchResponse {
	return response.BranchResponse{
		ID:             b.ID,
		OrganizationID: b.OrganizationID,
		ParentID:       b.ParentID,
		BranchCode:     b.Code,
		BranchName:     b.Name,
		Address:        b.Address,
		Status:         b.Status,
	}
}

func ToBranchList(branches []models.Branch) []response.BranchResponse {
	res := make([]response.BranchResponse, 0, len(branches))
	for i := range branches {
		res = append(res, ToBranchResponse(&branches[i]))
	}
	return res
}
