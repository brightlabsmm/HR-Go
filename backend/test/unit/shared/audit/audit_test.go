package audit_test

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/shared/audit"
	"hrgo/backend/internal/shared/security"
)

type spyRecorder struct {
	entries []audit.RecordInput
}

func (s *spyRecorder) Record(_ context.Context, input audit.RecordInput) error {
	s.entries = append(s.entries, input)
	return nil
}

func TestWorkspaceMutationMiddlewareCapturesCreatedIDAndSanitizes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	rec := &spyRecorder{}

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("auth_claims", &security.Claims{
			UserID:         "acc-1",
			OrganizationID: "org-1",
			AuthContext:    security.ContextWorkspace,
		})
		c.Next()
	})
	r.Use(audit.WorkspaceMutationMiddleware(rec))
	r.POST("/api/v1/workspace/branches", func(c *gin.Context) {
		c.JSON(http.StatusCreated, gin.H{
			"id":         "br-uuid-123",
			"branchCode": "BR-0006",
			"branchName": "Taung Gyi",
		})
	})
	r.POST("/api/v1/workspace/branches/:branchId/deactivate", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"id": c.Param("branchId"), "status": "INACTIVE"})
	})

	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/branches", bytes.NewBufferString(`{"branchName":"Taung Gyi","password":"secret"}`))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/branches/br-uuid-123/deactivate", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if len(rec.entries) != 2 {
		t.Fatalf("expected 2 audit entries, got %d", len(rec.entries))
	}

	first := rec.entries[0]
	if first.Action != "CREATE" || first.EntityName != "branches" || first.EntityID != "br-uuid-123" {
		t.Fatalf("unexpected first audit entry: %+v", first)
	}
	detailsMap, _ := first.Details.(map[string]any)
	reqMap, _ := detailsMap["request"].(map[string]any)
	if reqMap["password"] != "[REDACTED]" {
		t.Fatalf("expected password to be redacted, got %+v", reqMap["password"])
	}

	second := rec.entries[1]
	if second.Action != "DEACTIVATE" || second.EntityName != "branches" || second.EntityID != "br-uuid-123" {
		t.Fatalf("unexpected second audit entry: %+v", second)
	}
}
