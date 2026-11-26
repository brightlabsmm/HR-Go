package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/employee/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/employees")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("", sec.RequirePermission("org.employee.read"), h.List)
		group.GET("/summary", sec.RequirePermission("org.employee.read"), h.GetSummary)
		group.POST("", sec.RequirePermission("org.employee.create"), h.Create)
		group.GET("/:id", sec.RequirePermission("org.employee.read"), h.GetByID)
		group.PUT("/:id", sec.RequirePermission("org.employee.update"), h.Update)
		group.DELETE("/:id", sec.RequirePermission("org.employee.delete"), h.Delete)
		group.GET("/:id/position-history", sec.RequirePermission("org.employee.read"), h.GetPositionHistory)
		group.POST("/:id/position-history", sec.RequirePermission("org.employee.update"), h.ChangePosition)
	}
}
