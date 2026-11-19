package errors

import "net/http"

// FieldIssue describes a single field-level validation problem matching Section 3.7.
type FieldIssue struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ErrorBody matches Section 3.7: {"error": {"code": "...", "message": "...", "details": [...], "traceId": "..."}}
type ErrorBody struct {
	Code    string       `json:"code"`
	Message string       `json:"message"`
	Details []FieldIssue `json:"details"`
	TraceID string       `json:"traceId,omitempty"`
}

// Error is an internal/transport-safe application error mapped to HTTP JSON.
type Error struct {
	Status  int
	Code    string
	Message string
	Details []FieldIssue
}

func (e *Error) Error() string {
	return e.Message
}

// BadRequest builds a 400 error.
func BadRequest(message string) *Error {
	return &Error{Status: http.StatusBadRequest, Code: "BAD_REQUEST", Message: message, Details: []FieldIssue{}}
}

// ValidationFailed builds a 400 error with field-level issues.
func ValidationFailed(details []FieldIssue) *Error {
	if details == nil {
		details = []FieldIssue{}
	}
	return &Error{
		Status:  http.StatusBadRequest,
		Code:    "VALIDATION_ERROR",
		Message: "The request contains invalid data.",
		Details: details,
	}
}

// Unauthorized builds a 401 error.
func Unauthorized(message string) *Error {
	if message == "" {
		message = "Invalid or missing credentials."
	}
	return &Error{Status: http.StatusUnauthorized, Code: "UNAUTHORIZED", Message: message, Details: []FieldIssue{}}
}

// Forbidden builds a 403 error.
func Forbidden(message string) *Error {
	if message == "" {
		message = "You do not have permission to perform this action."
	}
	return &Error{Status: http.StatusForbidden, Code: "FORBIDDEN", Message: message, Details: []FieldIssue{}}
}

// NotFound builds a 404 error.
func NotFound(message string) *Error {
	return &Error{Status: http.StatusNotFound, Code: "NOT_FOUND", Message: message, Details: []FieldIssue{}}
}

// Conflict builds a 409 error.
func Conflict(message string) *Error {
	return &Error{Status: http.StatusConflict, Code: "CONFLICT", Message: message, Details: []FieldIssue{}}
}

// TooManyRequests builds a 429 error.
func TooManyRequests(message string) *Error {
	return &Error{Status: http.StatusTooManyRequests, Code: "RATE_LIMIT_EXCEEDED", Message: message, Details: []FieldIssue{}}
}

// Internal builds a generic 500 error.
func Internal() *Error {
	return &Error{
		Status:  http.StatusInternalServerError,
		Code:    "INTERNAL_SERVER_ERROR",
		Message: "Something went wrong.",
		Details: []FieldIssue{},
	}
}
