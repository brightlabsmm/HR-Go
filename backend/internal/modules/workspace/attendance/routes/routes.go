package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/attendance/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/attendance")
	group.Use(sec.RequireWorkspace())
	{
		group.POST("/check-in", sec.RequirePermission("org.attendance.create"), h.CheckIn)
		group.POST("/check-out", sec.RequirePermission("org.attendance.create"), h.CheckOut)
		group.POST("/manual", sec.RequirePermission("org.attendance.create"), h.ManualEntry)
		group.GET("/records", sec.RequirePermission("org.attendance.read"), h.ListRecords)
		group.GET("/records/:id", sec.RequirePermission("org.attendance.read"), h.GetRecordByID)
		group.GET("/summary", sec.RequirePermission("org.attendance.read"), h.GetSummary)

		group.POST("/corrections", sec.RequirePermission("org.attendance.correct"), h.SubmitCorrection)
		group.GET("/corrections", sec.RequirePermission("org.attendance.read"), h.ListCorrections)
		group.GET("/corrections/:id", sec.RequirePermission("org.attendance.read"), h.GetCorrectionByID)
		group.POST("/corrections/:id/review", sec.RequirePermission("org.attendance.approve"), h.ReviewCorrection)
	}
}
