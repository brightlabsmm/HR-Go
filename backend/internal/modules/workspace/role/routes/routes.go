package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/role/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("/roles", sec.RequirePermission("org.role.read"), h.ListRoles)
		group.PUT("/accounts/:accountId/roles", sec.RequirePermission("org.role.assign"), h.ReplaceAccountRoles)
	}
}
