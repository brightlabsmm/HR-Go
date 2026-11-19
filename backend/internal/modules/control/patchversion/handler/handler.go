package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/control/patchversion/service"
	"hrgo/backend/internal/shared/responses"
)

// Handler serves the public current patch version.
type Handler struct {
	svc service.Service
}

func New(svc service.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetCurrent(c *gin.Context) {
	res, appErr := h.svc.Current(c.Request.Context())
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}
