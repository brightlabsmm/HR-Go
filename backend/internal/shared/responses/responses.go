package responses

import (
	"net/http"

	"github.com/gin-gonic/gin"

	apperrors "hrgo/backend/internal/shared/errors"
)

// PaginatedResponse matches Section 3.5:
// {"items": [], "page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0}
type PaginatedResponse[T any] struct {
	Items      []T   `json:"items"`
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	TotalItems int64 `json:"totalItems"`
	TotalPages int   `json:"totalPages"`
}

// Single resource / generic success responses: Section 3.6
// For single-resource operations, the API returns the resource directly.

// OK writes 200 with the data directly as JSON.
func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, data)
}

// Created writes 201 with the created data directly as JSON.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, data)
}

// NoContent writes 204 without body.
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// Page writes standard Section 3.5 paginated JSON.
func Page[T any](c *gin.Context, items []T, page, pageSize int, totalItems int64) {
	if items == nil {
		items = []T{}
	}
	totalPages := 0
	if pageSize > 0 {
		totalPages = int((totalItems + int64(pageSize) - 1) / int64(pageSize))
	}
	c.JSON(http.StatusOK, PaginatedResponse[T]{
		Items:      items,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: totalItems,
		TotalPages: totalPages,
	})
}

// Fail writes error envelope matching Section 3.7:
// {"error": {"code": "...", "message": "...", "details": [...], "traceId": "..."}}
func Fail(c *gin.Context, err *apperrors.Error) {
	if err == nil {
		err = apperrors.Internal()
	}
	traceID := ""
	if val, exists := c.Get("request_id"); exists {
		traceID, _ = val.(string)
	}

	c.JSON(err.Status, gin.H{
		"error": apperrors.ErrorBody{
			Code:    err.Code,
			Message: err.Message,
			Details: err.Details,
			TraceID: traceID,
		},
	})
}
