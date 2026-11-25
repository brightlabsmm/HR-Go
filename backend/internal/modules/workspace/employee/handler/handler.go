package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/employee/request"
	"hrgo/backend/internal/modules/workspace/employee/service"
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
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.Create(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.Created(c, res)
}

func (h *Handler) GetByID(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	res, appErr := h.svc.GetByID(c.Request.Context(), claims.OrganizationID, id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) List(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ListEmployeesQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid query parameters."))
		return
	}

	res, appErr := h.svc.List(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) Update(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	var req request.UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.Update(c.Request.Context(), claims.OrganizationID, id, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) Delete(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	if appErr := h.svc.Delete(c.Request.Context(), claims.OrganizationID, id); appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, gin.H{"message": "Employee deleted successfully."})
}

func (h *Handler) GetPositionHistory(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	res, appErr := h.svc.GetPositionHistory(c.Request.Context(), claims.OrganizationID, id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ChangePosition(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	var req request.ChangePositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.ChangePosition(c.Request.Context(), claims.OrganizationID, id, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}
