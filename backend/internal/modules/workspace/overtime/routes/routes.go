package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/overtime/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/overtime")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("/categories", sec.RequirePermission("org.overtime.read"), h.ListCategories)
		group.POST("/categories", sec.RequirePermission("org.overtime.manage"), h.CreateCategory)

		group.GET("/requests", sec.RequirePermission("org.overtime.read"), h.ListRequests)
		group.POST("/requests", sec.RequirePermission("org.overtime.create"), h.CreateRequest)
		group.POST("/requests/:id/review", sec.RequirePermission("org.overtime.approve"), h.ReviewRequest)
		group.GET("/entries", sec.RequirePermission("org.overtime.read"), h.ListEntries)
	}

	mobileGroup := rg.Group("/workspace/mobile/overtime")
	mobileGroup.Use(sec.RequireWorkspace())
	{
		mobileGroup.GET("/categories", sec.RequirePermission("org.mobile.access"), h.MobileListCategories)
		mobileGroup.GET("/requests", sec.RequirePermission("org.mobile.access"), h.MobileListRequests)
		mobileGroup.POST("/requests", sec.RequirePermission("org.mobile.access"), h.MobileCreateRequest)
	}
}
