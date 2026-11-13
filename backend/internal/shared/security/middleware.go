package security

import (
	"strings"

	"github.com/gin-gonic/gin"

	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/responses"
)

const (
	KeyClaims = "auth_claims"
)

// Middleware provides authentication and authorization guards.
type Middleware struct {
	tokens *TokenManager
}

// NewMiddleware creates security middleware.
func NewMiddleware(tokens *TokenManager) *Middleware {
	return &Middleware{tokens: tokens}
}

// RequirePlatform enforces that the request has a valid PLATFORM JWT.
func (m *Middleware) RequirePlatform() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := m.extractClaims(c)
		if err != nil || claims.AuthContext != ContextPlatform {
			responses.Fail(c, apperrors.Unauthorized("Valid platform credentials required."))
			c.Abort()
			return
		}
		c.Set(KeyClaims, claims)
		c.Next()
	}
}

// RequireWorkspace enforces that the request has a valid WORKSPACE JWT with tenant context.
func (m *Middleware) RequireWorkspace() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := m.extractClaims(c)
		if err != nil || claims.AuthContext != ContextWorkspace || claims.OrganizationID == "" {
			responses.Fail(c, apperrors.Unauthorized("Valid workspace organization credentials required."))
			c.Abort()
			return
		}
		c.Set(KeyClaims, claims)
		c.Next()
	}
}

// RequirePermission checks if the authenticated principal possesses the required permission.
func (m *Middleware) RequirePermission(requiredPerm string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get(KeyClaims)
		if !exists {
			responses.Fail(c, apperrors.Unauthorized("Authentication required."))
			c.Abort()
			return
		}
		claims := val.(*Claims)

		has := false
		for _, p := range claims.Permissions {
			if p == requiredPerm || p == "platform.all" || p == "org.all" {
				has = true
				break
			}
		}
		if !has {
			responses.Fail(c, apperrors.Forbidden("Permission denied: "+requiredPerm))
			c.Abort()
			return
		}
		c.Next()
	}
}

func (m *Middleware) extractClaims(c *gin.Context) (*Claims, error) {
	header := c.GetHeader("Authorization")
	if header == "" {
		return nil, apperrors.Unauthorized("Missing Authorization header")
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return nil, apperrors.Unauthorized("Invalid Authorization header format")
	}

	return m.tokens.ValidateToken(parts[1])
}

// GetClaims retrieves Claims from context.
func GetClaims(c *gin.Context) *Claims {
	if val, ok := c.Get(KeyClaims); ok {
		if claims, ok := val.(*Claims); ok {
			return claims
		}
	}
	return nil
}
