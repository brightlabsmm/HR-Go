package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/organization/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/organization")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("", h.GetSettings)
		group.PATCH("", h.UpdateSettings)
	}

	settingsGroup := rg.Group("/workspace/settings")
	settingsGroup.Use(sec.RequireWorkspace())
	{
		settingsGroup.GET("", h.GetSettings)
		settingsGroup.PATCH("", h.UpdateSettings)
	}
}
