package request

type ListPermissionsQuery struct {
	Scope    string `form:"scope"` // PLATFORM or ORG
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=50"`
}
