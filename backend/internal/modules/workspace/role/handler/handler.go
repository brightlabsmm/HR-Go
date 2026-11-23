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
	var q request.ListRolesQuery
	_ = c.ShouldBindQuery(&q)

	roles, appErr := h.svc.ListRoles(c.Request.Context(), claims.OrganizationID, q)
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

func (h *Handler) ListPermissions(c *gin.Context) {
	var q request.ListPermissionsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	items, page, pageSize, total, appErr := h.svc.ListPermissions(c.Request.Context(), q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Page(c, items, page, pageSize, total)
}

func (h *Handler) UpdateRolePermissions(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	roleID := c.Param("roleId")

	var req request.ReplaceRolePermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.UpdateRolePermissions(c.Request.Context(), claims.OrganizationID, roleID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}
