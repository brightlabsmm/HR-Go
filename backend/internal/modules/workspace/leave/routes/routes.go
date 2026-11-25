package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/leave/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/leave")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("/types", sec.RequirePermission("org.leave.read"), h.ListTypes)
		group.POST("/types", sec.RequirePermission("org.leave.manage"), h.CreateType)
		group.PUT("/types/:id", sec.RequirePermission("org.leave.manage"), h.UpdateType)

		group.GET("/balances", sec.RequirePermission("org.leave.read"), h.ListBalances)
		group.POST("/adjustments", sec.RequirePermission("org.leave.manage"), h.AdjustBalance)

		group.GET("/requests", sec.RequirePermission("org.leave.read"), h.ListRequests)
		group.POST("/requests", sec.RequirePermission("org.leave.create"), h.CreateRequest)
		group.POST("/requests/:id/review", sec.RequirePermission("org.leave.approve"), h.ReviewRequest)
	}

	mobileGroup := rg.Group("/workspace/mobile/leave")
	mobileGroup.Use(sec.RequireWorkspace())
	{
		mobileGroup.GET("/balances", sec.RequirePermission("org.mobile.access"), h.MobileListBalances)
		mobileGroup.GET("/requests", sec.RequirePermission("org.mobile.access"), h.MobileListRequests)
		mobileGroup.POST("/requests", sec.RequirePermission("org.mobile.access"), h.MobileCreateRequest)
		mobileGroup.POST("/requests/:id/cancel", sec.RequirePermission("org.mobile.access"), h.MobileCancelRequest)
	}
}
