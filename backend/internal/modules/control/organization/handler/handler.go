package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/organization/request"
	"hrgo/backend/internal/modules/control/organization/service"
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
	var req request.CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "organization", Message: "Missing required organization fields."},
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
	var query request.ListOrganizationsQuery
	_ = c.ShouldBindQuery(&query)

	items, page, pageSize, total, appErr := h.svc.List(c.Request.Context(), query)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Page(c, items, page, pageSize, total)
}

func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("organizationId")
	res, appErr := h.svc.GetByID(c.Request.Context(), id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("organizationId")
	var req request.UpdateOrganizationRequest
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

func (h *Handler) UpdateStatus(c *gin.Context) {
	id := c.Param("organizationId")
	var req request.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid status payload."))
		return
	}

	res, appErr := h.svc.UpdateStatus(c.Request.Context(), id, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}
