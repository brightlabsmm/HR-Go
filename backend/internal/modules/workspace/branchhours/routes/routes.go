package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/branchhours/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/branches/:branchId/operating-hours")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("", sec.RequirePermission("org.branch.read"), h.List)
		group.PUT("", sec.RequirePermission("org.branch.update"), h.Upsert)
	}
}
