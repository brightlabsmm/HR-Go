package request

type ListAuditLogsQuery struct {
	Page       int    `form:"page,default=1" binding:"omitempty,min=1"`
	PageSize   int    `form:"pageSize,default=20" binding:"omitempty,min=1,max=100"`
	EntityName string `form:"entityName"`
	Action     string `form:"action"`
	ActorID    string `form:"actorId"`
	From       string `form:"from"`
	To         string `form:"to"`
}
