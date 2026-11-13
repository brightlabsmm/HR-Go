package request

type CreateBranchRequest struct {
	BranchCode string  `json:"branchCode" binding:"required"`
	BranchName string  `json:"branchName" binding:"required"`
	ParentID   *string `json:"parentId"`
	Address    string  `json:"address"`
}

type UpdateBranchRequest struct {
	BranchName *string `json:"branchName"`
	ParentID   *string `json:"parentId"`
	Address    *string `json:"address"`
}

type ListBranchesQuery struct {
	Q             string `form:"q"`
	Status        string `form:"status"`
	Page          int    `form:"page,default=1"`
	PageSize      int    `form:"pageSize,default=20"`
	SortBy        string `form:"sortBy"`
	SortDirection string `form:"sortDirection"`
}
