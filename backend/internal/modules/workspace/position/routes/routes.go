package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/position/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/positions")
	group.Use(sec.RequireWorkspace())
	{
		group.POST("", sec.RequirePermission("org.position.create"), h.Create)
		group.GET("", sec.RequirePermission("org.position.read"), h.List)
		group.GET("/:positionId", sec.RequirePermission("org.position.read"), h.GetByID)
		group.PATCH("/:positionId", sec.RequirePermission("org.position.update"), h.Update)
		group.POST("/:positionId/deactivate", sec.RequirePermission("org.position.deactivate"), h.Deactivate)
	}
}
