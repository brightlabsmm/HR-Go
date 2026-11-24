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
	DisplayName      string `json:"displayName" binding:"omitempty,max=255"`
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

	t.Run("converts unmarshal type errors to field issues", func(t *testing.T) {
		typeErr := json.Unmarshal([]byte(`{"organizationCode": 12345, "contactEmail": "test@acme.com"}`), &sampleRequest{})
		if typeErr == nil {
			t.Fatal("expected unmarshal type error, got nil")
		}

		appErr := apperrors.BindError(typeErr)
		if appErr == nil || appErr.Code != "VALIDATION_ERROR" || len(appErr.Details) == 0 {
			t.Fatalf("expected VALIDATION_ERROR with field details, got %+v", appErr)
		}
		if appErr.Details[0].Field != "organizationCode" {
			t.Errorf("expected field organizationCode, got %s", appErr.Details[0].Field)
		}
	})

	t.Run("returns bad request for non-validation error", func(t *testing.T) {
		syntaxErr := json.Unmarshal([]byte("invalid json"), &sampleRequest{})
		appErr := apperrors.BindError(syntaxErr)
		if appErr == nil || appErr.Status != http.StatusBadRequest || appErr.Code != "BAD_REQUEST" {
			t.Fatalf("expected BAD_REQUEST, got %+v", appErr)
		}
	})

	t.Run("converts max tag violation to field issue (BUG-33)", func(t *testing.T) {
		validate := validator.New()
		validate.SetTagName("binding")
		longName := ""
		for i := 0; i < 300; i++ {
			longName += "x"
		}
		err := validate.Struct(&sampleRequest{
			OrganizationCode: "ORG-1",
			DisplayName:      longName,
			ContactEmail:     "admin@acme.com",
		})
		if err == nil {
			t.Fatal("expected validation error, got nil")
		}

		appErr := apperrors.BindError(err)
		if appErr == nil || appErr.Code != "VALIDATION_ERROR" || len(appErr.Details) != 1 {
			t.Fatalf("expected 1 validation detail, got %+v", appErr)
		}
		if appErr.Details[0].Field != "displayName" {
			t.Errorf("expected field displayName, got %s", appErr.Details[0].Field)
		}
		if appErr.Details[0].Message != "Must not exceed 255 characters." {
			t.Errorf("expected max characters message, got %s", appErr.Details[0].Message)
		}
	})

	t.Run("returns nil for nil error", func(t *testing.T) {
		if apperrors.BindError(nil) != nil {
			t.Error("expected nil for nil error")
		}
	})
}
