package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/holiday/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/holidays")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("", sec.RequirePermission("org.holiday.read"), h.List)
		group.POST("", sec.RequirePermission("org.holiday.create"), h.Create)
		group.GET("/calendar", sec.RequirePermission("org.holiday.read"), h.GetCalendar)
		group.GET("/:id", sec.RequirePermission("org.holiday.read"), h.GetByID)
		group.PUT("/:id", sec.RequirePermission("org.holiday.update"), h.Update)
		group.DELETE("/:id", sec.RequirePermission("org.holiday.delete"), h.Delete)
	}
}
