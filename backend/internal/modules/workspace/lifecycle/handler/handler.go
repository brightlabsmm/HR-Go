package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/lifecycle/request"
	"hrgo/backend/internal/modules/workspace/lifecycle/service"
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

func auditFromGin(c *gin.Context) audit.RecordInput {
	actorID, actorType, ip, ua := audit.MetaFromGin(c)
	return audit.RecordInput{
		ActorID:   actorID,
		ActorType: actorType,
		ClientIP:  ip,
		UserAgent: ua,
	}
}

func (h *Handler) ListContracts(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListContracts(c.Request.Context(), claims.OrganizationID, c.Param("id"))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) CreateContract(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.CreateContractRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.CreateContract(c.Request.Context(), claims.OrganizationID, c.Param("id"), req, auditFromGin(c))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	audit.MarkRecorded(c)
	responses.Created(c, res)
}

func (h *Handler) UpdateContract(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.UpdateContractRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.UpdateContract(c.Request.Context(), claims.OrganizationID, c.Param("id"), c.Param("contractId"), req, auditFromGin(c))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	audit.MarkRecorded(c)
	responses.OK(c, res)
}

func (h *Handler) DeleteContract(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	if appErr := h.svc.DeleteContract(c.Request.Context(), claims.OrganizationID, c.Param("id"), c.Param("contractId"), auditFromGin(c)); appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	audit.MarkRecorded(c)
	responses.NoContent(c)
}

func (h *Handler) ListDocuments(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListDocuments(c.Request.Context(), claims.OrganizationID, c.Param("id"))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) CreateDocument(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.CreateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.CreateDocument(c.Request.Context(), claims.OrganizationID, c.Param("id"), req, auditFromGin(c))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	audit.MarkRecorded(c)
	responses.Created(c, res)
}

func (h *Handler) DeleteDocument(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	if appErr := h.svc.DeleteDocument(c.Request.Context(), claims.OrganizationID, c.Param("id"), c.Param("documentId"), auditFromGin(c)); appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	audit.MarkRecorded(c)
	responses.NoContent(c)
}

func (h *Handler) ListServiceYears(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListServiceYears(c.Request.Context(), claims.OrganizationID, c.Param("id"))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) RecalculateServiceYear(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.RecalculateServiceYearRequest
	if err := c.ShouldBindJSON(&req); err != nil && err.Error() != "EOF" {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.RecalculateServiceYear(c.Request.Context(), claims.OrganizationID, c.Param("id"), req, auditFromGin(c))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	audit.MarkRecorded(c)
	responses.OK(c, res)
}

func (h *Handler) ListExits(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListExitRecords(c.Request.Context(), claims.OrganizationID, c.Param("id"))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) RecordExit(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.RecordExitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.RecordExit(c.Request.Context(), claims.OrganizationID, c.Param("id"), claims.UserID, req, auditFromGin(c))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	audit.MarkRecorded(c)
	responses.Created(c, res)
}

func (h *Handler) ListHistories(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListHistories(c.Request.Context(), claims.OrganizationID, c.Param("id"))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}
