package middleware

import (
	"log/slog"
	"runtime/debug"

	"github.com/gin-gonic/gin"

	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/responses"
)

// Recovery catches panics in HTTP handlers, logs diagnostics internally,
// and writes a safe 500 JSON response without leaking stack traces.
func Recovery(logger *slog.Logger) gin.HandlerFunc {
	if logger == nil {
		logger = slog.Default()
	}

	return func(c *gin.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				logger.Error("http_panic_recovered",
					slog.String("request_id", GetRequestID(c)),
					slog.String("method", c.Request.Method),
					slog.String("path", c.Request.URL.Path),
					slog.Any("panic", rec),
					slog.String("stack", string(debug.Stack())),
				)

				if !c.Writer.Written() {
					responses.Fail(c, apperrors.Internal())
				}
				c.Abort()
			}
		}()

		c.Next()
	}
}
