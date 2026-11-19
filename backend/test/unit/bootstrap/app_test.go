package bootstrap_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/bootstrap"
	"hrgo/backend/internal/config"
	"hrgo/backend/internal/logging"
)

func TestEngineProbesAndNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var logBuf bytes.Buffer
	engine := bootstrap.NewEngine(bootstrap.Dependencies{
		Config: config.Config{
			AppEnv:             "test",
			MaxBodyBytes:       1 << 20,
			CORSAllowedOrigins: []string{"http://localhost:5173"},
		},
		Logger: logging.NewWithWriter(&logBuf, "test", "info"),
	})

	t.Run("GET /health returns 200 UP", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		rec := httptest.NewRecorder()
		engine.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		var payload map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("invalid JSON: %v", err)
		}
		if payload["status"] != "UP" {
			t.Errorf("status field = %v, want UP", payload["status"])
		}
	})

	t.Run("GET /ready returns 503 when DB is nil", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/ready", nil)
		rec := httptest.NewRecorder()
		engine.ServeHTTP(rec, req)

		if rec.Code != http.StatusServiceUnavailable {
			t.Fatalf("status = %d, want 503", rec.Code)
		}
	})

	t.Run("GET /ping returns 200 pong", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/ping", nil)
		rec := httptest.NewRecorder()
		engine.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		var payload struct {
			Message string `json:"message"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("invalid JSON: %v", err)
		}
		if payload.Message != "pong" {
			t.Fatalf("payload = %+v, want message=pong", payload)
		}
	})

	t.Run("unknown route returns JSON 404 error envelope", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/does-not-exist", nil)
		rec := httptest.NewRecorder()
		engine.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want 404", rec.Code)
		}
		var payload map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("invalid JSON: %v", err)
		}
		errObj, ok := payload["error"].(map[string]any)
		if !ok || errObj["code"] != "NOT_FOUND" {
			t.Errorf("expected error envelope with NOT_FOUND, got: %v", payload)
		}
	})
}
