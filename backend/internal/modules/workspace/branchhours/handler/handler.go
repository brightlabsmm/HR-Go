package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/branchhours/request"
	"hrgo/backend/internal/modules/workspace/branchhours/service"
	"hrgo/backend/internal/shared/audit"
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

func (h *Handler) List(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	res, appErr := h.svc.List(c.Request.Context(), claims.OrganizationID, c.Param("branchId"))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) Upsert(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.UpsertBranchOperatingHoursRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	actorID, actorType, ip, ua := audit.MetaFromGin(c)
	res, appErr := h.svc.Upsert(c.Request.Context(), claims.OrganizationID, c.Param("branchId"), req, audit.RecordInput{
		ActorID:   actorID,
		ActorType: actorType,
		ClientIP:  ip,
		UserAgent: ua,
	})
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	audit.MarkRecorded(c)
	responses.OK(c, gin.H{"items": res})
}
