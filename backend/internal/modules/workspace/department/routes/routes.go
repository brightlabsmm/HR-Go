package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/department/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/departments")
	group.Use(sec.RequireWorkspace())
	{
		group.POST("", sec.RequirePermission("org.department.create"), h.Create)
		group.GET("", sec.RequirePermission("org.department.read"), h.List)
		group.GET("/:departmentId", sec.RequirePermission("org.department.read"), h.GetByID)
		group.PATCH("/:departmentId", sec.RequirePermission("org.department.update"), h.Update)
		group.POST("/:departmentId/deactivate", sec.RequirePermission("org.department.deactivate"), h.Deactivate)
	}
}
