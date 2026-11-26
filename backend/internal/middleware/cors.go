package middleware

import (
	"net/http"
	"strconv"
	"strings"

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
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		if item == "*" || origin == item {
			return origin
		}
		if strings.HasSuffix(item, ":*") {
			prefix := strings.TrimSuffix(item, "*")
			if strings.HasPrefix(origin, prefix) && isValidPort(origin[len(prefix):]) {
				return origin
			}
		}
	}
	return ""
}

func isValidPort(raw string) bool {
	if raw == "" || len(raw) > 5 {
		return false
	}
	for i := 0; i < len(raw); i++ {
		if raw[i] < '0' || raw[i] > '9' {
			return false
		}
	}
	port, err := strconv.Atoi(raw)
	return err == nil && port >= 1 && port <= 65535
}
