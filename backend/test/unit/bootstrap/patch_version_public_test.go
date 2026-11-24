package bootstrap_test

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"hrgo/backend/internal/bootstrap"
	"hrgo/backend/internal/config"
	"hrgo/backend/internal/logging"
)

func TestPatchVersionRouteIsOutsideAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)

	sqlDB, err := sql.Open("pgx", "postgres://nobody@127.0.0.1:1/none?sslmode=disable&connect_timeout=1")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = sqlDB.Close() })

	db, err := gorm.Open(postgres.New(postgres.Config{Conn: sqlDB}), &gorm.Config{
		DisableAutomaticPing: true,
	})
	if err != nil {
		t.Fatal(err)
	}

	engine := bootstrap.NewEngine(bootstrap.Dependencies{
		Config: config.Config{
			AppEnv:                "test",
			JWTSecret:             "test-secret",
			PlatformAdminEmail:    "admin@example.com",
			PlatformAdminPassword: "Admin@12345",
			MaxBodyBytes:          1 << 20,
		},
		Logger: logging.NewWithWriter(&discardLogger{}, "test", "error"),
		DB:     db,
	})

	t.Run("unauthenticated GET is not rejected by auth middleware", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/patch-version", nil)
		rec := httptest.NewRecorder()
		engine.ServeHTTP(rec, req)

		if rec.Code == http.StatusUnauthorized {
			t.Fatalf("public route returned 401: %s", rec.Body.String())
		}
		if rec.Code == http.StatusNotFound {
			t.Fatalf("route is not registered: %s", rec.Body.String())
		}
		var body struct {
			Error struct {
				Code string `json:"code"`
			} `json:"error"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Error.Code == "UNAUTHORIZED" {
			t.Fatalf("public route returned UNAUTHORIZED: %s", rec.Body.String())
		}
	})

	t.Run("control route still requires platform auth", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/control/roles", nil)
		rec := httptest.NewRecorder()
		engine.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want 401, body %s", rec.Code, rec.Body.String())
		}
	})
}

type discardLogger struct{}

func (discardLogger) Write(p []byte) (int, error) { return len(p), nil }
