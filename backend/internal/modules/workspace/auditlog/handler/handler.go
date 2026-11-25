package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/auditlog/request"
	"hrgo/backend/internal/modules/workspace/auditlog/service"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/responses"
	"hrgo/backend/internal/shared/security"
)

type Handler struct {
	svc service.Service
}

func New(svc service.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) List(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ListAuditLogsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.PageSize <= 0 {
		q.PageSize = 20
	}

	items, total, appErr := h.svc.List(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.Page(c, items, q.Page, q.PageSize, total)
}
