package responses

import (
	"net/http"

	"github.com/gin-gonic/gin"

	apperrors "hrgo/backend/internal/shared/errors"
)

// Meta carries pagination metadata for list responses.
type Meta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type envelope struct {
	Success bool       `json:"success"`
	Data    any        `json:"data,omitempty"`
	Meta    *Meta      `json:"meta,omitempty"`
	Error   *errorBody `json:"error,omitempty"`
}

type errorBody struct {
	Code    string                 `json:"code"`
	Message string                 `json:"message"`
	Details []apperrors.FieldIssue `json:"details,omitempty"`
}

// OK writes a 200 JSON success envelope.
func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, envelope{Success: true, Data: data})
}

// Created writes a 201 JSON success envelope.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, envelope{Success: true, Data: data})
}

// NoContent writes a 204 empty response.
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// Page writes a 200 JSON list envelope with pagination metadata.
func Page(c *gin.Context, data any, meta Meta) {
	c.JSON(http.StatusOK, envelope{Success: true, Data: data, Meta: &meta})
}

// Fail writes an application error using the standard JSON error envelope.
func Fail(c *gin.Context, err *apperrors.Error) {
	if err == nil {
		err = apperrors.Internal()
	}
	c.JSON(err.Status, envelope{
		Success: false,
		Error: &errorBody{
			Code:    err.Code,
			Message: err.Message,
			Details: err.Details,
		},
	})
}
