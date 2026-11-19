package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/branch/request"
	"hrgo/backend/internal/modules/workspace/branch/service"
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

func (h *Handler) Create(c *gin.Context) {
	claims := security.GetClaims(c)
	var req request.CreateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "branch", Message: "Missing required branch fields."},
		}))
		return
	}

	res, appErr := h.svc.Create(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Created(c, res)
}

func (h *Handler) List(c *gin.Context) {
	claims := security.GetClaims(c)
	var q request.ListBranchesQuery
	_ = c.ShouldBindQuery(&q)

	items, page, pageSize, total, appErr := h.svc.List(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Page(c, items, page, pageSize, total)
}

func (h *Handler) GetByID(c *gin.Context) {
	claims := security.GetClaims(c)
	id := c.Param("branchId")

	res, appErr := h.svc.GetByID(c.Request.Context(), claims.OrganizationID, id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) Update(c *gin.Context) {
	claims := security.GetClaims(c)
	id := c.Param("branchId")
	var req request.UpdateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid update payload."))
		return
	}

	res, appErr := h.svc.Update(c.Request.Context(), claims.OrganizationID, id, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) Deactivate(c *gin.Context) {
	claims := security.GetClaims(c)
	id := c.Param("branchId")

	res, appErr := h.svc.Deactivate(c.Request.Context(), claims.OrganizationID, id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}
