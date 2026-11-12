package config_test

import (
	"testing"

	"hrgo/backend/internal/config"
)

func TestLoadDefaults(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("PORT", "")
	t.Setenv("LOG_LEVEL", "")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("CORS_ALLOWED_ORIGINS", "")
	t.Setenv("MAX_BODY_BYTES", "")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AppEnv != "development" {
		t.Errorf("AppEnv = %q, want %q", cfg.AppEnv, "development")
	}
	if cfg.Port != "8080" {
		t.Errorf("Port = %q, want %q", cfg.Port, "8080")
	}
	if cfg.LogLevel != "info" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "info")
	}
	if cfg.MaxBodyBytes != 1<<20 {
		t.Errorf("MaxBodyBytes = %d, want %d", cfg.MaxBodyBytes, 1<<20)
	}
	if cfg.IsProduction() {
		t.Errorf("expected IsProduction() == false in development")
	}
}

func TestLoadValidationAndParsing(t *testing.T) {
	t.Run("parses valid overrides", func(t *testing.T) {
		t.Setenv("APP_ENV", "production")
		t.Setenv("PORT", "9090")
		t.Setenv("LOG_LEVEL", "debug")
		t.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173, https://app.example.com")
		t.Setenv("MAX_BODY_BYTES", "2048")
		t.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/hrgo")

		cfg, err := config.Load()
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !cfg.IsProduction() {
			t.Errorf("expected IsProduction() == true")
		}
		if cfg.Port != "9090" {
			t.Errorf("Port = %q, want %q", cfg.Port, "9090")
		}
		if len(cfg.CORSAllowedOrigins) != 2 {
			t.Fatalf("CORSAllowedOrigins = %#v, want 2 origins", cfg.CORSAllowedOrigins)
		}
		if cfg.MaxBodyBytes != 2048 {
			t.Errorf("MaxBodyBytes = %d, want 2048", cfg.MaxBodyBytes)
		}
	})

	t.Run("rejects non-numeric port", func(t *testing.T) {
		t.Setenv("PORT", "not-a-port")
		if _, err := config.Load(); err == nil {
			t.Fatal("expected error for invalid PORT, got nil")
		}
	})

	t.Run("rejects non-positive MAX_BODY_BYTES", func(t *testing.T) {
		t.Setenv("PORT", "8080")
		t.Setenv("MAX_BODY_BYTES", "0")
		if _, err := config.Load(); err == nil {
			t.Fatal("expected error for zero MAX_BODY_BYTES, got nil")
		}
	})
}
