package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/user/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/users")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("", sec.RequireAnyPermission("org.user.read", "org.role.read"), h.List)
		group.POST("", sec.RequireAnyPermission("org.user.create", "org.role.assign"), h.Create)
		group.GET("/:id", sec.RequireAnyPermission("org.user.read", "org.role.read"), h.GetByID)
		group.PATCH("/:id", sec.RequireAnyPermission("org.user.update", "org.role.assign"), h.Update)
		group.PUT("/:id/roles", sec.RequireAnyPermission("org.role.assign"), h.ReplaceRoles)
		group.POST("/:id/deactivate", sec.RequireAnyPermission("org.user.deactivate", "org.role.assign"), h.Deactivate)
		group.POST("/:id/reactivate", sec.RequireAnyPermission("org.user.deactivate", "org.role.assign"), h.Reactivate)
	}
}
