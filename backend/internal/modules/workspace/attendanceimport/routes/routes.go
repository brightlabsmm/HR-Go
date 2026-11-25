package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/attendanceimport/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/attendance")
	group.Use(sec.RequireWorkspace())
	{
		group.POST("/imports", sec.RequirePermission("org.attendance.create"), h.ImportCSV)
		group.GET("/imports", sec.RequirePermission("org.attendance.read"), h.ListBatches)
		group.GET("/export", sec.RequirePermission("org.attendance.read"), h.ExportCSV)
	}
}
