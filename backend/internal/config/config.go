package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

const (
	defaultAppEnv         = "development"
	defaultPort           = "8080"
	defaultLogLevel       = "info"
	defaultMaxBodyBytes   = int64(1 << 20) // 1 MiB
	defaultJWTSecret      = "dev-only-secret-key-must-be-changed-in-production"
	defaultSuperadminPass = "Admin@12345"
)

// Config holds process-level server and infrastructure configuration.
type Config struct {
	AppEnv                string
	Port                  string
	LogLevel              string
	DatabaseURL           string
	CORSAllowedOrigins    []string
	MaxBodyBytes          int64
	JWTSecret             string
	PlatformAdminEmail    string
	PlatformAdminPassword string
	PlatformAdminFullName string
}

// Load reads .env files when present and parses environment configuration.
func Load() (Config, error) {
	_ = godotenv.Load()
	_ = godotenv.Load("backend/.env")

	appEnv := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	if appEnv == "" {
		appEnv = defaultAppEnv
	}

	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = defaultPort
	}
	if _, err := strconv.Atoi(port); err != nil {
		return Config{}, fmt.Errorf("invalid PORT %q: %w", port, err)
	}

	logLevel := strings.ToLower(strings.TrimSpace(os.Getenv("LOG_LEVEL")))
	if logLevel == "" {
		logLevel = defaultLogLevel
	}

	maxBodyBytes := defaultMaxBodyBytes
	if rawLimit := strings.TrimSpace(os.Getenv("MAX_BODY_BYTES")); rawLimit != "" {
		parsed, err := strconv.ParseInt(rawLimit, 10, 64)
		if err != nil || parsed <= 0 {
			return Config{}, fmt.Errorf("invalid MAX_BODY_BYTES %q: must be a positive integer", rawLimit)
		}
		maxBodyBytes = parsed
	}

	var dbURL string
	if rawDB := strings.TrimSpace(os.Getenv("DATABASE_URL")); rawDB != "" {
		dbURL = normalizeDatabaseURL(rawDB)
	}

	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if jwtSecret == "" {
		jwtSecret = defaultJWTSecret
	}

	adminEmail := strings.TrimSpace(os.Getenv("PLATFORM_ADMIN_EMAIL"))
	if adminEmail == "" {
		adminEmail = "admin@example.com"
	}

	adminPass := os.Getenv("PLATFORM_ADMIN_PASSWORD")
	if adminPass == "" {
		adminPass = defaultSuperadminPass
	}

	adminName := strings.TrimSpace(os.Getenv("PLATFORM_ADMIN_FULL_NAME"))
	if adminName == "" {
		adminName = "Platform Superadmin"
	}

	return Config{
		AppEnv:                appEnv,
		Port:                  port,
		LogLevel:              logLevel,
		DatabaseURL:           dbURL,
		CORSAllowedOrigins:    splitList(os.Getenv("CORS_ALLOWED_ORIGINS")),
		MaxBodyBytes:          maxBodyBytes,
		JWTSecret:             jwtSecret,
		PlatformAdminEmail:    adminEmail,
		PlatformAdminPassword: adminPass,
		PlatformAdminFullName: adminName,
	}, nil
}

// IsProduction reports whether the process is running in production or staging.
func (c Config) IsProduction() bool {
	return c.AppEnv == "production" || c.AppEnv == "prod" || c.AppEnv == "staging"
}

func splitList(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}

func normalizeDatabaseURL(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	query := parsed.Query()
	query.Del("channel_binding")
	if query.Get("TimeZone") == "" {
		query.Set("TimeZone", "UTC")
	}
	parsed.RawQuery = query.Encode()
	return parsed.String()
}
