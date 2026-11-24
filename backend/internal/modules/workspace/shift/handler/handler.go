package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/shift/request"
	"hrgo/backend/internal/modules/workspace/shift/service"
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

func (h *Handler) CreateShift(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.CreateShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.CreateShift(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.Created(c, res)
}

func (h *Handler) GetShiftByID(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	res, appErr := h.svc.GetShiftByID(c.Request.Context(), claims.OrganizationID, id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ListShifts(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ListShiftsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid query parameters."))
		return
	}

	res, appErr := h.svc.ListShifts(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) UpdateShift(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	var req request.UpdateShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.UpdateShift(c.Request.Context(), claims.OrganizationID, id, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) DeleteShift(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	if appErr := h.svc.DeleteShift(c.Request.Context(), claims.OrganizationID, id); appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, gin.H{"message": "Shift deleted successfully."})
}

func (h *Handler) AssignShift(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.AssignShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.AssignShift(c.Request.Context(), claims.OrganizationID, claims.Subject, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.Created(c, res)
}

func (h *Handler) GetAssignmentByID(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	res, appErr := h.svc.GetAssignmentByID(c.Request.Context(), claims.OrganizationID, id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ListAssignments(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ListAssignmentsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid query parameters."))
		return
	}

	res, appErr := h.svc.ListAssignments(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ListEmployeeAssignments(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	employeeID := c.Param("id")
	res, appErr := h.svc.ListEmployeeAssignments(c.Request.Context(), claims.OrganizationID, employeeID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ListAssignmentHistory(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	employeeID := c.Param("id")
	res, appErr := h.svc.ListAssignmentHistory(c.Request.Context(), claims.OrganizationID, employeeID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}
