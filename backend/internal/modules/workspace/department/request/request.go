package request

type CreateDepartmentRequest struct {
	DepartmentCode string  `json:"departmentCode" binding:"required"`
	DepartmentName string  `json:"departmentName" binding:"required"`
	BranchID       *string `json:"branchId"`
}

type UpdateDepartmentRequest struct {
	DepartmentName *string `json:"departmentName"`
	BranchID       *string `json:"branchId"`
}

type ListDepartmentsQuery struct {
	Q             string  `form:"q"`
	BranchID      *string `form:"branchId"`
	Status        string  `form:"status"`
	Page          int     `form:"page,default=1"`
	PageSize      int     `form:"pageSize,default=20"`
	SortBy        string  `form:"sortBy"`
	SortDirection string  `form:"sortDirection"`
}
