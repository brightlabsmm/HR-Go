package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS applies origin allow-list checks and preflight headers.
func CORS(allowed []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		resolved := AllowedOrigin(origin, allowed)
		if resolved == "" && len(allowed) == 0 && origin != "" {
			resolved = origin
		}
		if resolved != "" {
			c.Header("Access-Control-Allow-Origin", resolved)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// AllowedOrigin returns origin when it matches an entry in allowed.
func AllowedOrigin(origin string, allowed []string) string {
	if origin == "" {
		return ""
	}
	for _, item := range allowed {
		if item == "*" || origin == item {
			return origin
		}
	}
	return ""
}
