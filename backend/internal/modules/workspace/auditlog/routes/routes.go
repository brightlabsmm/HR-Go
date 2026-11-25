package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/auditlog/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/audit-logs")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("", sec.RequirePermission("org.audit.read"), h.List)
	}
}
