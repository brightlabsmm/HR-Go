package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/auth/request"
	"hrgo/backend/internal/modules/workspace/auth/service"
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
	var req request.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "credentials", Message: "Identifier and password are required."},
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

func (h *Handler) Logout(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims != nil && claims.SessionID != "" {
		_ = h.svc.Logout(c.Request.Context(), claims.SessionID)
	}
	responses.NoContent(c)
}

func (h *Handler) GetMe(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	res, appErr := h.svc.GetMe(c.Request.Context(), claims.UserID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) ChangePassword(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.ChangePasswordRequest
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
