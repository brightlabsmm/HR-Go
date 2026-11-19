package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/auth/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/control/auth")
	{
		group.POST("/login", h.Login)
		group.POST("/logout", sec.RequirePlatform(), h.Logout)
		group.GET("/me", sec.RequirePlatform(), h.GetMe)
	}
}
