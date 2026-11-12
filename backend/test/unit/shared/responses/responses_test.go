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

	t.Run("OK writes success envelope", func(t *testing.T) {
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		responses.OK(c, map[string]string{"ping": "pong"})

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		var payload map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("invalid JSON: %v", err)
		}
		if payload["success"] != true {
			t.Errorf("success = %v, want true", payload["success"])
		}
	})

	t.Run("Fail writes error envelope", func(t *testing.T) {
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
		if payload["success"] != false {
			t.Errorf("success = %v, want false", payload["success"])
		}
		errObj, ok := payload["error"].(map[string]any)
		if !ok || errObj["code"] != "BAD_REQUEST" {
			t.Errorf("error = %#v, want code BAD_REQUEST", payload["error"])
		}
	})
}
