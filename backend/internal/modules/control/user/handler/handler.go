package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/user/request"
	"hrgo/backend/internal/modules/control/user/service"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/responses"
)

type Handler struct {
	svc service.Service
}

func New(svc service.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Create(c *gin.Context) {
	var req request.CreatePlatformUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "user", Message: "Missing or invalid platform user fields."},
		}))
		return
	}

	res, appErr := h.svc.Create(c.Request.Context(), req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Created(c, res)
}

func (h *Handler) List(c *gin.Context) {
	var q request.ListUsersQuery
	_ = c.ShouldBindQuery(&q)

	items, page, pageSize, total, appErr := h.svc.List(c.Request.Context(), q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Page(c, items, page, pageSize, total)
}

func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("platformUserId")
	res, appErr := h.svc.GetByID(c.Request.Context(), id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("platformUserId")
	var req request.UpdatePlatformUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid update payload."))
		return
	}

	res, appErr := h.svc.Update(c.Request.Context(), id, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) ReplaceRoles(c *gin.Context) {
	id := c.Param("platformUserId")
	var req request.ReplaceRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid role payload."))
		return
	}

	res, appErr := h.svc.ReplaceRoles(c.Request.Context(), id, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) Deactivate(c *gin.Context) {
	id := c.Param("platformUserId")
	res, appErr := h.svc.Deactivate(c.Request.Context(), id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) Reactivate(c *gin.Context) {
	id := c.Param("platformUserId")
	res, appErr := h.svc.Reactivate(c.Request.Context(), id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}
