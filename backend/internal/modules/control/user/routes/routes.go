package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/user/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/control/users")
	group.Use(sec.RequirePlatform())
	{
		group.GET("", sec.RequirePermission("platform.user.read"), h.List)
		group.POST("", sec.RequirePermission("platform.user.create"), h.Create)
		group.GET("/:platformUserId", sec.RequirePermission("platform.user.read"), h.GetByID)
		group.PATCH("/:platformUserId", sec.RequirePermission("platform.user.update"), h.Update)
		group.PUT("/:platformUserId/roles", sec.RequirePermission("platform.role.assign"), h.ReplaceRoles)
		group.POST("/:platformUserId/deactivate", sec.RequirePermission("platform.user.deactivate"), h.Deactivate)
		group.POST("/:platformUserId/reactivate", sec.RequirePermission("platform.user.update"), h.Reactivate)
	}
}
