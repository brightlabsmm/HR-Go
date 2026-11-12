package bootstrap

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"hrgo/backend/internal/config"
	"hrgo/backend/internal/database"
	"hrgo/backend/internal/middleware"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/responses"
)

// Dependencies groups shared infrastructure dependencies wired into the HTTP engine.
type Dependencies struct {
	Config config.Config
	Logger *slog.Logger
	DB     *gorm.DB
}

// NewEngine constructs the Gin engine with shared middleware and health probes.
// Feature module routes should be registered here once modules are implemented.
func NewEngine(deps Dependencies) *gin.Engine {
	if deps.Config.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	logger := deps.Logger
	if logger == nil {
		logger = slog.Default()
	}

	engine := gin.New()
	engine.Use(
		middleware.RequestID(),
		middleware.Recovery(logger),
		middleware.Logger(logger),
		middleware.SecurityHeaders(),
		middleware.MaxBodySize(deps.Config.MaxBodyBytes),
		middleware.CORS(deps.Config.CORSAllowedOrigins),
	)

	engine.NoRoute(func(c *gin.Context) {
		responses.Fail(c, apperrors.NotFound("Route not found."))
	})

	registerProbes(engine, deps.DB)

	engine.GET("/ping", func(c *gin.Context) {
		responses.OK(c, gin.H{"message": "pong"})
	})

	return engine
}

func registerProbes(engine *gin.Engine, db *gorm.DB) {
	// Liveness probe: verifies HTTP process responsiveness.
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "UP",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Readiness probe: verifies PostgreSQL database pool connectivity.
	engine.GET("/ready", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		if err := database.Ping(ctx, db); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":    "DOWN",
				"database":  "DOWN",
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":    "UP",
			"database":  "UP",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})
}
