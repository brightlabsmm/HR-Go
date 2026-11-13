package request

type CreatePlatformUserRequest struct {
	FullName string   `json:"fullName" binding:"required"`
	Email    string   `json:"email" binding:"required,email"`
	Password string   `json:"password" binding:"required,min=8"`
	RoleIDs  []string `json:"roleIds" binding:"required"`
}

type UpdatePlatformUserRequest struct {
	FullName *string `json:"fullName"`
	Email    *string `json:"email"`
}

type ReplaceRolesRequest struct {
	RoleIDs []string `json:"roleIds" binding:"required"`
}

type ListUsersQuery struct {
	Q        string `form:"q"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=20"`
}
