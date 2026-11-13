package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/auth/request"
	"hrgo/backend/internal/modules/control/auth/service"
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
			{Field: "credentials", Message: "Valid email and password are required."},
		}))
		return
	}

	res, appErr := h.svc.Login(c.Request.Context(), req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) Logout(c *gin.Context) {
	responses.NoContent(c)
}

func (h *Handler) GetMe(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	profile, appErr := h.svc.GetMe(c.Request.Context(), claims.UserID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, profile)
}
