package logging

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// New creates a structured slog.Logger configured for the given environment and level.
func New(appEnv, level string) *slog.Logger {
	return NewWithWriter(os.Stdout, appEnv, level)
}

// NewWithWriter creates a structured slog.Logger writing to w.
func NewWithWriter(w io.Writer, appEnv, level string) *slog.Logger {
	if w == nil {
		w = os.Stdout
	}
	opts := &slog.HandlerOptions{
		Level: parseLevel(level),
	}

	var handler slog.Handler
	if isTextMode(appEnv) {
		handler = slog.NewTextHandler(w, opts)
	} else {
		handler = slog.NewJSONHandler(w, opts)
	}

	return slog.New(handler)
}

func parseLevel(raw string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func isTextMode(appEnv string) bool {
	switch strings.ToLower(strings.TrimSpace(appEnv)) {
	case "development", "dev", "local", "test":
		return true
	default:
		return false
	}
}
