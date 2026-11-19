package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/shared/security"
)

func TestRequireWorkspaceOrgStatusChecker(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tokens := security.NewTokenManager("super-secret-jwt-key-for-testing-only-32bytes")
	token, _, err := tokens.GenerateWorkspaceToken("acc-1", "org-1", "emp-1", "EMP-001", "", "", []string{})
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	t.Run("allows active organization", func(t *testing.T) {
		sec := security.NewMiddleware(tokens)
		sec.SetOrgStatusChecker(func(ctx context.Context, orgID string) (string, error) {
			return "ACTIVE", nil
		})

		r := gin.New()
		r.GET("/workspace/test", sec.RequireWorkspace(), func(c *gin.Context) {
			c.String(http.StatusOK, "ok")
		})

		req := httptest.NewRequest(http.MethodGet, "/workspace/test", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})

	t.Run("rejects suspended organization with 401 Unauthorized", func(t *testing.T) {
		sec := security.NewMiddleware(tokens)
		sec.SetOrgStatusChecker(func(ctx context.Context, orgID string) (string, error) {
			return "SUSPENDED", nil
		})

		r := gin.New()
		r.GET("/workspace/test", sec.RequireWorkspace(), func(c *gin.Context) {
			c.String(http.StatusOK, "ok")
		})

		req := httptest.NewRequest(http.MethodGet, "/workspace/test", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", rec.Code)
		}
	})
}
