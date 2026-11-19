package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/patchversion/handler"
)

// Register exposes the current patch version without authentication.
// Both the platform console and the organization portal read it on the login screen.
// The route is mounted on the engine, not on a RouterGroup that uses auth middleware.
func Register(engine *gin.Engine, h *handler.Handler) {
	engine.GET("/api/v1/patch-version", h.GetCurrent)
}
