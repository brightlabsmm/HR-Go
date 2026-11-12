package errors

import "net/http"

// FieldIssue describes a single field-level validation error.
type FieldIssue struct {
	Field string `json:"field"`
	Issue string `json:"issue"`
}

// Error is a transport-safe application error mapped to the HTTP JSON envelope.
type Error struct {
	Status  int
	Code    string
	Message string
	Details []FieldIssue
}

func (e *Error) Error() string {
	return e.Message
}

// BadRequest builds a 400 error for invalid requests.
func BadRequest(message string) *Error {
	return &Error{Status: http.StatusBadRequest, Code: "BAD_REQUEST", Message: message}
}

// ValidationFailed builds a 400 error with field-level validation issues.
func ValidationFailed(details []FieldIssue) *Error {
	return &Error{
		Status:  http.StatusBadRequest,
		Code:    "VALIDATION_FAILED",
		Message: "The request payload failed validation.",
		Details: details,
	}
}

// Unauthorized builds a 401 error.
func Unauthorized(message string) *Error {
	return &Error{Status: http.StatusUnauthorized, Code: "UNAUTHORIZED", Message: message}
}

// Forbidden builds a 403 error.
func Forbidden(code, message string) *Error {
	if code == "" {
		code = "FORBIDDEN"
	}
	return &Error{Status: http.StatusForbidden, Code: code, Message: message}
}

// NotFound builds a 404 error.
func NotFound(message string) *Error {
	return &Error{Status: http.StatusNotFound, Code: "NOT_FOUND", Message: message}
}

// Conflict builds a 409 error.
func Conflict(message string) *Error {
	return &Error{Status: http.StatusConflict, Code: "RESOURCE_CONFLICT", Message: message}
}

// TooManyRequests builds a 429 error.
func TooManyRequests(message string) *Error {
	return &Error{Status: http.StatusTooManyRequests, Code: "RATE_LIMIT_EXCEEDED", Message: message}
}

// Internal builds a generic 500 error without exposing internal details.
func Internal() *Error {
	return &Error{
		Status:  http.StatusInternalServerError,
		Code:    "INTERNAL_SERVER_ERROR",
		Message: "Something went wrong.",
	}
}
