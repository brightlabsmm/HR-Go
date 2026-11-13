package security

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a plain text password with bcrypt.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(bytes), nil
}

// CheckPassword compares a bcrypt hash with a plain text password.
func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// AuthContext identifies whether a token is for PLATFORM or WORKSPACE.
type AuthContext string

const (
	ContextPlatform  AuthContext = "PLATFORM"
	ContextWorkspace AuthContext = "WORKSPACE"
)

// Claims represents claims stored in JWT.
type Claims struct {
	UserID         string      `json:"sub"`
	AuthContext    AuthContext `json:"ctx"`
	Email          string      `json:"email,omitempty"`
	OrganizationID string      `json:"org_id,omitempty"`
	EmployeeID     string      `json:"emp_id,omitempty"`
	EmployeeCode   string      `json:"emp_code,omitempty"`
	BranchID       string      `json:"branch_id,omitempty"`
	DepartmentID   string      `json:"dept_id,omitempty"`
	Permissions    []string    `json:"perms,omitempty"`
	jwt.RegisteredClaims
}

// TokenManager handles issuing and parsing tokens.
type TokenManager struct {
	secret []byte
	expiry time.Duration
}

// NewTokenManager initializes TokenManager.
func NewTokenManager(secret string) *TokenManager {
	return &TokenManager{
		secret: []byte(secret),
		expiry: 24 * time.Hour,
	}
}

// GeneratePlatformToken creates a JWT for a platform user.
func (m *TokenManager) GeneratePlatformToken(userID, email string, perms []string) (string, int64, error) {
	exp := time.Now().Add(m.expiry)
	claims := Claims{
		UserID:      userID,
		AuthContext: ContextPlatform,
		Email:       email,
		Permissions: perms,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", 0, fmt.Errorf("sign platform token: %w", err)
	}
	return signed, int64(m.expiry.Seconds()), nil
}

// GenerateWorkspaceToken creates a JWT for an organization account.
func (m *TokenManager) GenerateWorkspaceToken(accountID, orgID, empID, empCode, branchID, deptID string, perms []string) (string, int64, error) {
	exp := time.Now().Add(m.expiry)
	claims := Claims{
		UserID:         accountID,
		AuthContext:    ContextWorkspace,
		OrganizationID: orgID,
		EmployeeID:     empID,
		EmployeeCode:   empCode,
		BranchID:       branchID,
		DepartmentID:   deptID,
		Permissions:    perms,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   accountID,
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", 0, fmt.Errorf("sign workspace token: %w", err)
	}
	return signed, int64(m.expiry.Seconds()), nil
}

// ValidateToken parses and validates a JWT token.
func (m *TokenManager) ValidateToken(raw string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(raw, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
