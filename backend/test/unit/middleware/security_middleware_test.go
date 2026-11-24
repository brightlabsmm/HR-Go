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

	t.Run("allows when session checker returns valid", func(t *testing.T) {
		sec := security.NewMiddleware(tokens)
		sec.SetWorkspaceSessionChecker(func(ctx context.Context, claims *security.Claims) (bool, error) {
			return true, nil
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

	t.Run("rejects revoked session with 401 Unauthorized", func(t *testing.T) {
		sec := security.NewMiddleware(tokens)
		sec.SetWorkspaceSessionChecker(func(ctx context.Context, claims *security.Claims) (bool, error) {
			return false, nil
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

	t.Run("simulates logout session revocation (BUG-30)", func(t *testing.T) {
		sessionID := "sess-123"
		tokenWithSession, _, err := tokens.GenerateWorkspaceTokenWithSession(
			sessionID, "acc-1", "org-1", "emp-1", "EMP-001", "", "", []string{},
		)
		if err != nil {
			t.Fatalf("failed to generate token: %v", err)
		}

		activeSessions := map[string]bool{
			sessionID: true,
		}

		sec := security.NewMiddleware(tokens)
		sec.SetWorkspaceSessionChecker(func(ctx context.Context, claims *security.Claims) (bool, error) {
			if claims.SessionID == "" {
				return false, nil
			}
			return activeSessions[claims.SessionID], nil
		})

		r := gin.New()
		r.GET("/workspace/resource", sec.RequireWorkspace(), func(c *gin.Context) {
			c.String(http.StatusOK, "resource access granted")
		})

		// 1. Before logout: request succeeds with 200
		req1 := httptest.NewRequest(http.MethodGet, "/workspace/resource", nil)
		req1.Header.Set("Authorization", "Bearer "+tokenWithSession)
		rec1 := httptest.NewRecorder()
		r.ServeHTTP(rec1, req1)
		if rec1.Code != http.StatusOK {
			t.Fatalf("before logout status = %d, want 200", rec1.Code)
		}

		// 2. User logs out -> session revoked
		delete(activeSessions, sessionID)

		// 3. After logout: calling API with old token fails with 401 Unauthorized
		req2 := httptest.NewRequest(http.MethodGet, "/workspace/resource", nil)
		req2.Header.Set("Authorization", "Bearer "+tokenWithSession)
		rec2 := httptest.NewRecorder()
		r.ServeHTTP(rec2, req2)
		if rec2.Code != http.StatusUnauthorized {
			t.Fatalf("after logout status = %d, want 401 Unauthorized (BUG-30)", rec2.Code)
		}
	})
}
