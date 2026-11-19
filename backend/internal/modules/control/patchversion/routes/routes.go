package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/patchversion/handler"
)

// Register exposes the current patch version without authentication.
// Both the platform console and the organization portal read it on the login screen.
func Register(rg *gin.RouterGroup, h *handler.Handler) {
	rg.GET("/patch-version", h.GetCurrent)
}
