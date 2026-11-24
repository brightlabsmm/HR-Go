package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/attendance/request"
	"hrgo/backend/internal/modules/workspace/attendance/service"
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

func (h *Handler) CheckIn(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.CheckIn(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.Created(c, res)
}

func (h *Handler) CheckOut(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.CheckOutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.CheckOut(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ManualEntry(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.ManualAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.ManualEntry(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.Created(c, res)
}

func (h *Handler) GetRecordByID(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	res, appErr := h.svc.GetRecordByID(c.Request.Context(), claims.OrganizationID, id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ListRecords(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ListAttendanceQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid query parameters."))
		return
	}

	res, appErr := h.svc.ListRecords(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) GetSummary(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.AttendanceSummaryQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid query parameters, from and to are required."))
		return
	}

	res, appErr := h.svc.GetSummary(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) SubmitCorrection(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.CreateCorrectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.SubmitCorrection(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.Created(c, res)
}

func (h *Handler) GetCorrectionByID(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	res, appErr := h.svc.GetCorrectionByID(c.Request.Context(), claims.OrganizationID, id)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ListCorrections(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ListCorrectionsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BadRequest("Invalid query parameters."))
		return
	}

	res, appErr := h.svc.ListCorrections(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}

func (h *Handler) ReviewCorrection(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	id := c.Param("id")
	var req request.ReviewCorrectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.ReviewCorrection(c.Request.Context(), claims.OrganizationID, claims.Subject, id, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	responses.OK(c, res)
}
