package handler

import (
	"time"

	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/leave/request"
	"hrgo/backend/internal/modules/workspace/leave/service"
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

func (h *Handler) ListTypes(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListTypes(c.Request.Context(), claims.OrganizationID, false)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) CreateType(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.CreateLeaveTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.CreateType(c.Request.Context(), claims.OrganizationID, req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.Created(c, res)
}

func (h *Handler) UpdateType(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.UpdateLeaveTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.UpdateType(c.Request.Context(), claims.OrganizationID, c.Param("id"), req)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}

func (h *Handler) ListBalances(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var q request.ListLeaveBalancesQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.ListBalances(c.Request.Context(), claims.OrganizationID, q, q.EmployeeID != "")
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, gin.H{"items": res})
}

func (h *Handler) AdjustBalance(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	var req request.AdjustLeaveBalanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Fail(c, apperrors.BindError(err))
		return
	}
	res, appErr := h.svc.AdjustBalance(c.Request.Context(), claims.OrganizationID, claims.UserID, req)
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
	var q request.ListLeaveRequestsQuery
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
	var req request.CreateLeaveRequest
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
	var req request.ReviewLeaveRequest
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

// Mobile Self-Service Endpoints
func (h *Handler) MobileListBalances(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.ListBalances(c.Request.Context(), claims.OrganizationID, request.ListLeaveBalancesQuery{
		EmployeeID: claims.EmployeeID,
		Year:       time.Now().UTC().Year(),
	}, true)
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
	var q request.ListLeaveRequestsQuery
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
	var req request.CreateLeaveRequest
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

func (h *Handler) MobileCancelRequest(c *gin.Context) {
	claims := security.GetClaims(c)
	if claims == nil || claims.OrganizationID == "" || claims.EmployeeID == "" {
		responses.Fail(c, apperrors.Unauthorized("Unauthorized"))
		return
	}
	res, appErr := h.svc.CancelOwnRequest(c.Request.Context(), claims.OrganizationID, c.Param("id"), claims.EmployeeID)
	if appErr != nil {
		responses.Fail(c, appErr)
		return
	}
	responses.OK(c, res)
}
