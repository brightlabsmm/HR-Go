package handler

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/overtime/request"
	"hrgo/backend/internal/modules/workspace/overtime/service"
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

func (h *Handler) ListCategories(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListCategories(c.Request.Context(), claims.OrganizationID, false)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) CreateCategory(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.CreateOvertimeCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.CreateCategory(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Created(c, res)
}

func (h *Handler) ListRequests(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var q request.ListOvertimeRequestsQuery
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
	items, total, appErr := h.svc.ListRequests(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Page(c, items, q.Page, q.PageSize, total)
}

func (h *Handler) CreateRequest(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.CreateOvertimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.CreateRequest(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Created(c, res)
}

func (h *Handler) ReviewRequest(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.ReviewOvertimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.ReviewRequest(c.Request.Context(), claims.OrganizationID, c.Param("id"), claims.UserID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) ListEntries(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListEntries(c.Request.Context(), claims.OrganizationID, c.Query("employeeId"))
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

// Mobile Self-Service Endpoints
func (h *Handler) MobileListCategories(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListCategories(c.Request.Context(), claims.OrganizationID, true)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) MobileListRequests(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var q request.ListOvertimeRequestsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.PageSize <= 0 {
		q.PageSize = 50
	}
	q.EmployeeID = claims.EmployeeID
	items, total, appErr := h.svc.ListRequests(c.Request.Context(), claims.OrganizationID, q)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Page(c, items, q.Page, q.PageSize, total)
}

func (h *Handler) MobileCreateRequest(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.CreateOvertimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	req.EmployeeID = claims.EmployeeID
	res, appErr := h.svc.CreateRequest(c.Request.Context(), claims.OrganizationID, claims.EmployeeID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Created(c, res)
}
