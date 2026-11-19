package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/auth/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/auth")
	{
		group.POST("/login", h.Login)
		group.POST("/logout", sec.RequireWorkspace(), h.Logout)
		group.GET("/me", sec.RequireWorkspace(), h.GetMe)
	}
}
