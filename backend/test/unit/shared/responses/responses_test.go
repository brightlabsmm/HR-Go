package responses_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/responses"
)

func TestEnvelopes(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("OK writes direct data payload", func(t *testing.T) {
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		responses.OK(c, map[string]string{"ping": "pong"})

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		var payload map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("invalid JSON: %v", err)
		}
		if payload["ping"] != "pong" {
			t.Errorf("ping = %v, want pong", payload["ping"])
		}
	})

	t.Run("Fail writes Section 3.7 error envelope", func(t *testing.T) {
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		responses.Fail(c, apperrors.BadRequest("bad input"))

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", rec.Code)
		}
		var payload map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("invalid JSON: %v", err)
		}
		errObj, ok := payload["error"].(map[string]any)
		if !ok || errObj["code"] != "BAD_REQUEST" {
			t.Errorf("error = %#v, want code BAD_REQUEST", payload["error"])
		}
	})

	t.Run("Page writes Section 3.5 paginated structure", func(t *testing.T) {
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		responses.Page(c, []string{"item1", "item2"}, 1, 10, 2)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		var payload struct {
			Items      []string `json:"items"`
			Page       int      `json:"page"`
			PageSize   int      `json:"pageSize"`
			TotalItems int64    `json:"totalItems"`
			TotalPages int      `json:"totalPages"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("invalid JSON: %v", err)
		}
		if len(payload.Items) != 2 || payload.TotalItems != 2 || payload.TotalPages != 1 {
			t.Errorf("invalid pagination envelope: %+v", payload)
		}
	})
}
