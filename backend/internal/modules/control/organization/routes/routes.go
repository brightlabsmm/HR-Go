package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/organization/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/control/organizations")
	group.Use(sec.RequirePlatform())
	{
		group.POST("", sec.RequirePermission("platform.organization.create"), h.Create)
		group.GET("", sec.RequirePermission("platform.organization.read"), h.List)
		group.GET("/:organizationId", sec.RequirePermission("platform.organization.read"), h.GetByID)
		group.PATCH("/:organizationId", sec.RequirePermission("platform.organization.update"), h.Update)
		group.DELETE("/:organizationId", sec.RequirePermission("platform.organization.delete"), h.Delete)
		group.POST("/:organizationId/status", sec.RequirePermission("platform.organization.status.update"), h.UpdateStatus)
		group.DELETE("/:organizationId/suspend-schedule", sec.RequirePermission("platform.organization.status.update"), h.CancelSuspendSchedule)
		group.POST("/:organizationId/admin-account", sec.RequirePermission("platform.organization.update"), h.CreateAdminAccount)
		group.GET("/:organizationId/admin-accounts", sec.RequirePermission("platform.organization.read"), h.ListAdminAccounts)
	}
}
