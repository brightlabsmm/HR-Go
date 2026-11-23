package errors_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/go-playground/validator/v10"

	apperrors "hrgo/backend/internal/shared/errors"
)

type sampleRequest struct {
	OrganizationCode string `json:"organizationCode" binding:"required"`
	ContactEmail     string `json:"contactEmail" binding:"required,email"`
}

func TestBindError(t *testing.T) {
	t.Run("converts validation errors to field issues with lowerCamelCase", func(t *testing.T) {
		validate := validator.New()
		validate.SetTagName("binding")
		err := validate.Struct(&sampleRequest{})
		if err == nil {
			t.Fatal("expected validation error, got nil")
		}

		appErr := apperrors.BindError(err)
		if appErr == nil {
			t.Fatal("expected appErr, got nil")
		}
		if appErr.Status != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", appErr.Status)
		}
		if appErr.Code != "VALIDATION_ERROR" {
			t.Errorf("expected code VALIDATION_ERROR, got %s", appErr.Code)
		}
		if len(appErr.Details) != 2 {
			t.Fatalf("expected 2 details, got %d", len(appErr.Details))
		}

		fieldMap := make(map[string]string)
		for _, d := range appErr.Details {
			fieldMap[d.Field] = d.Message
		}

		if msg, ok := fieldMap["organizationCode"]; !ok || msg == "" {
			t.Errorf("expected field issue for organizationCode, got %v", fieldMap)
		}
		if msg, ok := fieldMap["contactEmail"]; !ok || msg == "" {
			t.Errorf("expected field issue for contactEmail, got %v", fieldMap)
		}
	})

	t.Run("returns bad request for non-validation error", func(t *testing.T) {
		syntaxErr := json.Unmarshal([]byte("invalid json"), &sampleRequest{})
		appErr := apperrors.BindError(syntaxErr)
		if appErr == nil || appErr.Status != http.StatusBadRequest || appErr.Code != "BAD_REQUEST" {
			t.Fatalf("expected BAD_REQUEST, got %+v", appErr)
		}
	})

	t.Run("returns nil for nil error", func(t *testing.T) {
		if apperrors.BindError(nil) != nil {
			t.Error("expected nil for nil error")
		}
	})
}
