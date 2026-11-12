package middleware_test

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/logging"
	"hrgo/backend/internal/middleware"
)

func TestRequestID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(middleware.RequestID())
	r.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, middleware.GetRequestID(c))
	})

	t.Run("generates request id when missing", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/ping", nil)
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)

		id := rec.Header().Get(middleware.HeaderRequestID)
		if id == "" {
			t.Fatal("expected generated X-Request-ID header")
		}
		if rec.Body.String() != id {
			t.Errorf("context request id = %q, header = %q", rec.Body.String(), id)
		}
	})

	t.Run("preserves incoming request id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/ping", nil)
		req.Header.Set(middleware.HeaderRequestID, "req-123")
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)

		if got := rec.Header().Get(middleware.HeaderRequestID); got != "req-123" {
			t.Errorf("X-Request-ID = %q, want %q", got, "req-123")
		}
	})
}

func TestAllowedOrigin(t *testing.T) {
	allowed := []string{"http://localhost:5173", "https://app.example.com"}

	if got := middleware.AllowedOrigin("http://localhost:5173", allowed); got != "http://localhost:5173" {
		t.Errorf("AllowedOrigin = %q, want localhost", got)
	}
	if got := middleware.AllowedOrigin("https://evil.example", allowed); got != "" {
		t.Errorf("AllowedOrigin = %q, want empty for disallowed origin", got)
	}
}

func TestRecoveryDoesNotLeakStackTrace(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var logBuf bytes.Buffer
	logger := logging.NewWithWriter(&logBuf, "production", "error")

	r := gin.New()
	r.Use(middleware.RequestID(), middleware.Recovery(logger))
	r.GET("/boom", func(c *gin.Context) {
		panic("sensitive internal failure")
	})

	req := httptest.NewRequest(http.MethodGet, "/boom", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
	body := rec.Body.String()
	if strings.Contains(body, "sensitive internal failure") || strings.Contains(body, "goroutine") {
		t.Fatalf("response leaked internal panic details: %s", body)
	}
	if !strings.Contains(logBuf.String(), "http_panic_recovered") {
		t.Fatalf("expected panic log entry, got %s", logBuf.String())
	}
}

func TestMaxBodySizeAndSecurityHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(middleware.SecurityHeaders(), middleware.MaxBodySize(8))
	r.POST("/echo", func(c *gin.Context) {
		_, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.Status(http.StatusRequestEntityTooLarge)
			return
		}
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/echo", strings.NewReader("0123456789abcdef"))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, want 413", rec.Code)
	}
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Errorf("missing X-Content-Type-Options header")
	}
	if rec.Header().Get("X-Frame-Options") != "DENY" {
		t.Errorf("missing X-Frame-Options header")
	}
}
