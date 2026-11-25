package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/attendanceimport/request"
	"hrgo/backend/internal/modules/workspace/attendanceimport/service"
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

func (h *Handler) ImportCSV(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var req request.ImportAttendanceCSVRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	actorID, actorType, ip, ua := audit.MetaFromGin(c)
	res, appErr := h.svc.ImportCSV(c.Request.Context(), claims.OrganizationID, claims.UserID, req, audit.RecordInput{
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
	responses.Created(c, res)
}

func (h *Handler) ListBatches(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ListImportBatchesQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.PageSize <= 0 {
		q.PageSize = 20
	}

	items, total, appErr := h.svc.ListBatches(c.Request.Context(), claims.OrganizationID, q.Page, q.PageSize)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Page(c, items, q.Page, q.PageSize, total)
}

func (h *Handler) ExportCSV(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}

	var q request.ExportAttendanceQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}

	data, appErr := h.svc.ExportCSV(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}

	c.Header("Content-Disposition", `attachment; filename="attendance-export.csv"`)
	c.Data(http.StatusOK, "text/csv; charset=utf-8", data)
}
