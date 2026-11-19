package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/branch/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/branches")
	group.Use(sec.RequireWorkspace())
	{
		group.POST("", sec.RequirePermission("org.branch.create"), h.Create)
		group.GET("", sec.RequirePermission("org.branch.read"), h.List)
		group.GET("/:branchId", sec.RequirePermission("org.branch.read"), h.GetByID)
		group.PATCH("/:branchId", sec.RequirePermission("org.branch.update"), h.Update)
		group.POST("/:branchId/deactivate", sec.RequirePermission("org.branch.deactivate"), h.Deactivate)
	}
}
