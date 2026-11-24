package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/mobile/request"
	"hrgo/backend/internal/modules/workspace/mobile/service"
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

func (h *Handler) Login(c *gin.Context) {
	var req request.MobileLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "credentials", Message: "Identifier, password, and deviceIdentifier are required."},
		}))
		return
	}

	clientIP := c.ClientIP()
	userAgent := c.Request.UserAgent()
	meta := service.SessionMetadata{
		IPAddress: &clientIP,
		UserAgent: &userAgent,
	}

	res, appErr := h.svc.Login(c.Request.Context(), req, meta)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) ChangePassword(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.UserID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.MobileChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	if appErr := h.svc.ChangePassword(c.Request.Context(), claims.UserID, req); appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"message": "Password changed successfully."})
}

func (h *Handler) GetProfile(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	res, appErr := h.svc.GetProfile(c.Request.Context(), claims.OrganizationID, claims.EmployeeID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) GetShift(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	res, appErr := h.svc.GetShift(c.Request.Context(), claims.OrganizationID, claims.EmployeeID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) GetTodayAttendance(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	res, appErr := h.svc.GetTodayAttendance(c.Request.Context(), claims.OrganizationID, claims.EmployeeID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) CheckIn(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.MobilePunchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.CheckIn(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Created(c, res)
}

func (h *Handler) CheckOut(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.MobilePunchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.CheckOut(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) ListAttendanceHistory(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.MobileAttendanceHistoryQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.ListAttendanceHistory(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) GetCalendar(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.MobileCalendarQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.GetCalendar(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) SubmitCorrection(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.MobileCorrectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.SubmitCorrection(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Created(c, res)
}

func (h *Handler) ListCorrections(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ListMobileCorrectionsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.ListCorrections(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) SyncOfflinePunches(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.MobileSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	res, appErr := h.svc.SyncOfflinePunches(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}
