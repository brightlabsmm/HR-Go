package logging_test

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"

	"hrgo/backend/internal/logging"
)

func TestNewWithWriter(t *testing.T) {
	t.Run("writes JSON logs in production", func(t *testing.T) {
		var buf bytes.Buffer
		logger := logging.NewWithWriter(&buf, "production", "info")
		logger.Debug("ignored debug")
		logger.Info("server started", "port", "8080")

		output := strings.TrimSpace(buf.String())
		if strings.Contains(output, "ignored debug") {
			t.Fatalf("debug message should be filtered at info level: %s", output)
		}

		var payload map[string]any
		if err := json.Unmarshal([]byte(output), &payload); err != nil {
			t.Fatalf("expected valid JSON log line, got %q: %v", output, err)
		}
		if payload["msg"] != "server started" {
			t.Errorf("msg = %v, want %q", payload["msg"], "server started")
		}
	})

	t.Run("writes text logs in development", func(t *testing.T) {
		var buf bytes.Buffer
		logger := logging.NewWithWriter(&buf, "development", "debug")
		logger.Debug("dev debug")

		if !strings.Contains(buf.String(), "dev debug") {
			t.Fatalf("expected debug output in development mode, got %q", buf.String())
		}
	})
}
