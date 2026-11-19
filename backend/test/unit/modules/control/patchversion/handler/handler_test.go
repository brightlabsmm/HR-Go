package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/patchversion/handler"
	"hrgo/backend/internal/modules/control/patchversion/response"
	"hrgo/backend/internal/modules/control/patchversion/service"
	apperrors "hrgo/backend/internal/shared/errors"
)

type fakeService struct {
	res *response.PatchVersionResponse
	err *apperrors.Error
}

func (f fakeService) Current(context.Context) (*response.PatchVersionResponse, *apperrors.Error) {
	return f.res, f.err
}

func TestGetCurrent(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("success", func(t *testing.T) {
		h := handler.New(fakeService{res: &response.PatchVersionResponse{
			PatchVersion:  "01.00.01",
			PatchDateTime: time.Date(2026, 11, 19, 15, 14, 0, 0, time.FixedZone("Asia/Bangkok", 7*60*60)),
			Current:       true,
		}})
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/patch-version", nil)

		h.GetCurrent(c)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, body %s", rec.Code, rec.Body.String())
		}
		var body response.PatchVersionResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("json: %v", err)
		}
		if body.PatchVersion != "01.00.01" || !body.Current {
			t.Fatalf("body = %+v", body)
		}
	})

	t.Run("not found", func(t *testing.T) {
		h := handler.New(fakeService{err: apperrors.NotFound("Current patch version not found")})
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/patch-version", nil)

		h.GetCurrent(c)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("status = %d, body %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Error struct {
				Code    string `json:"code"`
				Message string `json:"message"`
			} `json:"error"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("json: %v", err)
		}
		if body.Error.Code != "NOT_FOUND" || body.Error.Message != "Current patch version not found" {
			t.Fatalf("error = %+v", body.Error)
		}
	})
}

var _ service.Service = fakeService{}
