package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/mobile/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/mobile")
	{
		// Public endpoint for mobile login & device registration
		group.POST("/auth/login", h.Login)

		// Authenticated mobile endpoints
		authenticated := group.Group("")
		authenticated.Use(sec.RequireWorkspace(), sec.RequirePermission("org.mobile.access"))
		{
			authenticated.POST("/change-password", h.ChangePassword)
			authenticated.GET("/profile", h.GetProfile)
			authenticated.GET("/shift", h.GetShift)

			attendance := authenticated.Group("/attendance")
			{
				attendance.GET("/today", h.GetTodayAttendance)
				attendance.POST("/check-in", h.CheckIn)
				attendance.POST("/check-out", h.CheckOut)
				attendance.GET("/history", h.ListAttendanceHistory)
				attendance.POST("/corrections", h.SubmitCorrection)
				attendance.GET("/corrections", h.ListCorrections)
				attendance.POST("/sync", h.SyncOfflinePunches)
			}

			authenticated.GET("/calendar", h.GetCalendar)
		}
	}
}
