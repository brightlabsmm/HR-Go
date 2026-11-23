package security

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"

	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/responses"
)

const (
	KeyClaims = "auth_claims"
)

// OrgStatusChecker checks the live status of an organization.
type OrgStatusChecker func(ctx context.Context, orgID string) (string, error)

// Middleware provides authentication and authorization guards.
type Middleware struct {
	tokens           *TokenManager
	orgStatusChecker OrgStatusChecker
}

// NewMiddleware creates security middleware.
func NewMiddleware(tokens *TokenManager) *Middleware {
	return &Middleware{tokens: tokens}
}

// SetOrgStatusChecker sets the callback for validating organization status.
func (m *Middleware) SetOrgStatusChecker(checker OrgStatusChecker) {
	m.orgStatusChecker = checker
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

		if m.orgStatusChecker != nil {
			status, err := m.orgStatusChecker(c.Request.Context(), claims.OrganizationID)
			if err != nil || status != "ACTIVE" {
				responses.Fail(c, apperrors.Unauthorized("Organization is not active or has been suspended."))
				c.Abort()
				return
			}
		}

		c.Set(KeyClaims, claims)
		c.Next()
	}
}

// RequirePermission checks if the authenticated principal possesses the required permission.
func (m *Middleware) RequirePermission(requiredPerm string) gin.HandlerFunc {
	return m.RequireAnyPermission(requiredPerm)
}

// RequireAnyPermission checks if the authenticated principal possesses at least one of the required permissions.
func (m *Middleware) RequireAnyPermission(perms ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get(KeyClaims)
		if !exists {
			responses.Fail(c, apperrors.Unauthorized("Authentication required."))
			c.Abort()
			return
		}
		claims := val.(*Claims)

		has := false
		for _, claimPerm := range claims.Permissions {
			if claimPerm == "platform.all" || claimPerm == "org.all" {
				has = true
				break
			}
			for _, required := range perms {
				if claimPerm == required {
					has = true
					break
				}
			}
			if has {
				break
			}
		}
		if !has {
			responses.Fail(c, apperrors.Forbidden("Permission denied"))
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
