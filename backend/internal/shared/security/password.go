package security

import (
	"errors"
	"strings"
	"unicode"
)

var commonWeakPasswords = map[string]struct{}{
	"12345678":      {},
	"123456789":     {},
	"1234567890":    {},
	"password":      {},
	"password1":     {},
	"password123":   {},
	"admin123":      {},
	"admin1234":     {},
	"administrator": {},
	"qwerty123":     {},
	"welcome1":      {},
	"welcome123":    {},
	"letmein1":      {},
}

var (
	ErrPasswordTooShort   = errors.New("Password must be at least 8 characters.")
	ErrPasswordComplexity = errors.New("Password must include at least one uppercase letter, one lowercase letter, and one number.")
	ErrPasswordTooCommon  = errors.New("Password is too common or weak. Please choose a stronger password.")
)

// ValidatePasswordStrength checks password length, character complexity, and blocks common passwords.
func ValidatePasswordStrength(password string) error {
	trimmed := strings.TrimSpace(password)
	if len(trimmed) < 8 {
		return ErrPasswordTooShort
	}

	var hasUpper, hasLower, hasDigit bool
	for _, ch := range trimmed {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		}
	}

	if !hasUpper || !hasLower || !hasDigit {
		return ErrPasswordComplexity
	}

	if _, ok := commonWeakPasswords[strings.ToLower(trimmed)]; ok {
		return ErrPasswordTooCommon
	}

	return nil
}
