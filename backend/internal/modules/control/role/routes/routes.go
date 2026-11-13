package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/role/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/control")
	group.Use(sec.RequirePlatform())
	{
		group.GET("/roles", sec.RequirePermission("platform.role.read"), h.ListRoles)
		group.GET("/permissions", sec.RequirePermission("platform.permission.read"), h.ListPermissions)
	}
}
