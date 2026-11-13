package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/role/request"
	"hrgo/backend/internal/modules/control/role/service"
	"hrgo/backend/internal/shared/responses"
)

type Handler struct {
	svc service.Service
}

func New(svc service.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) ListRoles(c *gin.Context) {
	roles, appErr := h.svc.ListRoles(c.Request.Context())
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, roles)
}

func (h *Handler) ListPermissions(c *gin.Context) {
	var q request.ListPermissionsQuery
	_ = c.ShouldBindQuery(&q)

	items, page, pageSize, total, appErr := h.svc.ListPermissions(c.Request.Context(), q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Page(c, items, page, pageSize, total)
}
