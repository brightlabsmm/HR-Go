package security_test

import (
	"testing"

	"hrgo/backend/internal/shared/security"
)

func TestValidatePasswordStrength(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  error
	}{
		{"too short", "Ab1", security.ErrPasswordTooShort},
		{"no uppercase", "abcdefg1", security.ErrPasswordComplexity},
		{"no lowercase", "ABCDEFG1", security.ErrPasswordComplexity},
		{"no digit", "Abcdefgh", security.ErrPasswordComplexity},
		{"common numbers", "12345678", security.ErrPasswordComplexity},
		{"common weak with complexity", "Admin123", security.ErrPasswordTooCommon},
		{"common password with complexity", "Password123", security.ErrPasswordTooCommon},
		{"valid strong password", "StrongP@ss123", nil},
		{"valid password mixed alphanumeric", "Secret99Abc", nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := security.ValidatePasswordStrength(tt.password)
			if tt.wantErr == nil && err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
			if tt.wantErr != nil && err != tt.wantErr {
				t.Fatalf("expected %v, got %v", tt.wantErr, err)
			}
		})
	}
}
