package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/role/request"
	"hrgo/backend/internal/modules/workspace/role/service"
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

func (h *Handler) ListRoles(c *gin.Context) {
	claims := security.GetClaims(c)
	roles, appErr := h.svc.ListRoles(c.Request.Context(), claims.OrganizationID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, roles)
}

func (h *Handler) ReplaceAccountRoles(c *gin.Context) {
	claims := security.GetClaims(c)
	accountID := c.Param("accountId")

	var req request.ReplaceAccountRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid role assignments payload."))
		return
	}

	appErr := h.svc.ReplaceAccountRoles(c.Request.Context(), claims.OrganizationID, accountID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.NoContent(c)
}
