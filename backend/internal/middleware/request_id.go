package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	// HeaderRequestID is the HTTP header used to propagate request IDs.
	HeaderRequestID = "X-Request-ID"
	requestIDKey    = "request_id"
)

// RequestID reads an incoming X-Request-ID header or generates a UUID,
// storing it in the Gin context and echoing it on the response.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := strings.TrimSpace(c.GetHeader(HeaderRequestID))
		if id == "" {
			id = uuid.NewString()
		}

		c.Set(requestIDKey, id)
		c.Header(HeaderRequestID, id)
		c.Next()
	}
}

// GetRequestID returns the request ID stored in the Gin context, if any.
func GetRequestID(c *gin.Context) string {
	if c == nil {
		return ""
	}
	id, ok := c.Get(requestIDKey)
	if !ok {
		return ""
	}
	value, _ := id.(string)
	return value
}
