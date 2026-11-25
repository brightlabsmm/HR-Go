package service

import (
	"context"
	"math"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/lifecycle/models"
	"hrgo/backend/internal/modules/workspace/lifecycle/repository"
	"hrgo/backend/internal/modules/workspace/lifecycle/request"
	"hrgo/backend/internal/modules/workspace/lifecycle/response"
	"hrgo/backend/internal/shared/audit"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	ListContracts(ctx context.Context, orgID, employeeID string) ([]response.ContractResponse, *apperrors.Error)
	CreateContract(ctx context.Context, orgID, employeeID string, req request.CreateContractRequest, auditCtx audit.RecordInput) (*response.ContractResponse, *apperrors.Error)
	UpdateContract(ctx context.Context, orgID, employeeID, contractID string, req request.UpdateContractRequest, auditCtx audit.RecordInput) (*response.ContractResponse, *apperrors.Error)
	DeleteContract(ctx context.Context, orgID, employeeID, contractID string, auditCtx audit.RecordInput) *apperrors.Error

	ListDocuments(ctx context.Context, orgID, employeeID string) ([]response.DocumentResponse, *apperrors.Error)
	CreateDocument(ctx context.Context, orgID, employeeID string, req request.CreateDocumentRequest, auditCtx audit.RecordInput) (*response.DocumentResponse, *apperrors.Error)
	DeleteDocument(ctx context.Context, orgID, employeeID, documentID string, auditCtx audit.RecordInput) *apperrors.Error

	ListServiceYears(ctx context.Context, orgID, employeeID string) ([]response.ServiceYearResponse, *apperrors.Error)
	RecalculateServiceYear(ctx context.Context, orgID, employeeID string, req request.RecalculateServiceYearRequest, auditCtx audit.RecordInput) (*response.ServiceYearResponse, *apperrors.Error)

	ListExitRecords(ctx context.Context, orgID, employeeID string) ([]response.ExitRecordResponse, *apperrors.Error)
	ListHistories(ctx context.Context, orgID, employeeID string) ([]response.EmployeeHistoryResponse, *apperrors.Error)
	RecordExit(ctx context.Context, orgID, employeeID, actorAccountID string, req request.RecordExitRequest, auditCtx audit.RecordInput) (*response.ExitRecordResponse, *apperrors.Error)
}

type svc struct {
	repo     repository.Repository
	recorder audit.Recorder
}

func New(repo repository.Repository, recorder audit.Recorder) Service {
	return &svc{repo: repo, recorder: recorder}
}

func (s *svc) ensureEmployee(ctx context.Context, orgID, employeeID string) *apperrors.Error {
	ok, err := s.repo.ValidateEmployee(ctx, orgID, employeeID)
	if err != nil {
		return apperrors.Internal()
	}
	if !ok {
		return apperrors.NotFound("Employee not found in organization.")
	}
	return nil
}

func (s *svc) ListContracts(ctx context.Context, orgID, employeeID string) ([]response.ContractResponse, *apperrors.Error) {
	if appErr := s.ensureEmployee(ctx, orgID, employeeID); appErr != nil {
		return nil, appErr
	}
	rows, err := s.repo.ListContracts(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.ContractResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toContractResp(r))
	}
	return out, nil
}

func (s *svc) CreateContract(ctx context.Context, orgID, employeeID string, req request.CreateContractRequest, auditCtx audit.RecordInput) (*response.ContractResponse, *apperrors.Error) {
	if appErr := s.ensureEmployee(ctx, orgID, employeeID); appErr != nil {
		return nil, appErr
	}
	start, err := time.Parse("2006-01-02", strings.TrimSpace(req.StartDate))
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "startDate", Message: "startDate must be YYYY-MM-DD."}})
	}
	var end *time.Time
	if req.EndDate != nil && strings.TrimSpace(*req.EndDate) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*req.EndDate))
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endDate", Message: "endDate must be YYYY-MM-DD."}})
		}
		if parsed.Before(start) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endDate", Message: "endDate cannot be earlier than startDate."}})
		}
		end = &parsed
	}

	status := "ACTIVE"
	if req.ContractStatus != nil && strings.TrimSpace(*req.ContractStatus) != "" {
		status = strings.ToUpper(strings.TrimSpace(*req.ContractStatus))
	}

	m := &models.EmploymentContract{
		OrganizationID: orgID,
		EmployeeID:     employeeID,
		ContractType:   strings.ToUpper(strings.TrimSpace(req.ContractType)),
		StartDate:      start,
		EndDate:        end,
		ContractStatus: status,
		Notes:          req.Notes,
	}
	if err := s.repo.CreateContract(ctx, m); err != nil {
		return nil, apperrors.Internal()
	}

	res := toContractResp(*m)
	s.emitAudit(ctx, auditCtx, orgID, "CREATE_CONTRACT", "employment_contracts", m.ID, nil, res)
	return &res, nil
}

func (s *svc) UpdateContract(ctx context.Context, orgID, employeeID, contractID string, req request.UpdateContractRequest, auditCtx audit.RecordInput) (*response.ContractResponse, *apperrors.Error) {
	existing, err := s.repo.FindContractByID(ctx, orgID, employeeID, contractID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Employment contract not found.")
		}
		return nil, apperrors.Internal()
	}

	oldResp := toContractResp(*existing)
	if req.ContractType != nil && strings.TrimSpace(*req.ContractType) != "" {
		existing.ContractType = strings.ToUpper(strings.TrimSpace(*req.ContractType))
	}
	if req.StartDate != nil && strings.TrimSpace(*req.StartDate) != "" {
		start, parseErr := time.Parse("2006-01-02", strings.TrimSpace(*req.StartDate))
		if parseErr != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "startDate", Message: "startDate must be YYYY-MM-DD."}})
		}
		existing.StartDate = start
	}
	if req.EndDate != nil {
		if strings.TrimSpace(*req.EndDate) == "" {
			existing.EndDate = nil
		} else {
			parsed, parseErr := time.Parse("2006-01-02", strings.TrimSpace(*req.EndDate))
			if parseErr != nil {
				return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endDate", Message: "endDate must be YYYY-MM-DD."}})
			}
			existing.EndDate = &parsed
		}
	}
	if existing.EndDate != nil && existing.EndDate.Before(existing.StartDate) {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endDate", Message: "endDate cannot be earlier than startDate."}})
	}
	if req.ContractStatus != nil && strings.TrimSpace(*req.ContractStatus) != "" {
		existing.ContractStatus = strings.ToUpper(strings.TrimSpace(*req.ContractStatus))
	}
	if req.Notes != nil {
		existing.Notes = req.Notes
	}
	existing.UpdatedAt = time.Now().UTC()

	if err := s.repo.UpdateContract(ctx, existing); err != nil {
		return nil, apperrors.Internal()
	}
	res := toContractResp(*existing)
	s.emitAudit(ctx, auditCtx, orgID, "UPDATE_CONTRACT", "employment_contracts", existing.ID, oldResp, res)
	return &res, nil
}

func (s *svc) DeleteContract(ctx context.Context, orgID, employeeID, contractID string, auditCtx audit.RecordInput) *apperrors.Error {
	existing, err := s.repo.FindContractByID(ctx, orgID, employeeID, contractID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return apperrors.NotFound("Employment contract not found.")
		}
		return apperrors.Internal()
	}
	if err := s.repo.SoftDeleteContract(ctx, orgID, employeeID, contractID); err != nil {
		return apperrors.Internal()
	}
	s.emitAudit(ctx, auditCtx, orgID, "DELETE_CONTRACT", "employment_contracts", contractID, toContractResp(*existing), nil)
	return nil
}

func (s *svc) ListDocuments(ctx context.Context, orgID, employeeID string) ([]response.DocumentResponse, *apperrors.Error) {
	if appErr := s.ensureEmployee(ctx, orgID, employeeID); appErr != nil {
		return nil, appErr
	}
	rows, err := s.repo.ListDocuments(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.DocumentResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toDocResp(r))
	}
	return out, nil
}

func (s *svc) CreateDocument(ctx context.Context, orgID, employeeID string, req request.CreateDocumentRequest, auditCtx audit.RecordInput) (*response.DocumentResponse, *apperrors.Error) {
	if appErr := s.ensureEmployee(ctx, orgID, employeeID); appErr != nil {
		return nil, appErr
	}
	var expiry *time.Time
	if req.ExpiryDate != nil && strings.TrimSpace(*req.ExpiryDate) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*req.ExpiryDate))
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "expiryDate", Message: "expiryDate must be YYYY-MM-DD."}})
		}
		expiry = &parsed
	}

	m := &models.EmployeeDocument{
		OrganizationID: orgID,
		EmployeeID:     employeeID,
		DocumentType:   strings.ToUpper(strings.TrimSpace(req.DocumentType)),
		DocumentName:   strings.TrimSpace(req.DocumentName),
		FileReference:  strings.TrimSpace(req.FileReference),
		ExpiryDate:     expiry,
	}
	if err := s.repo.CreateDocument(ctx, m); err != nil {
		return nil, apperrors.Internal()
	}
	res := toDocResp(*m)
	s.emitAudit(ctx, auditCtx, orgID, "CREATE_DOCUMENT", "employee_documents", m.ID, nil, res)
	return &res, nil
}

func (s *svc) DeleteDocument(ctx context.Context, orgID, employeeID, documentID string, auditCtx audit.RecordInput) *apperrors.Error {
	existing, err := s.repo.FindDocumentByID(ctx, orgID, employeeID, documentID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return apperrors.NotFound("Employee document not found.")
		}
		return apperrors.Internal()
	}
	if err := s.repo.SoftDeleteDocument(ctx, orgID, employeeID, documentID); err != nil {
		return apperrors.Internal()
	}
	s.emitAudit(ctx, auditCtx, orgID, "DELETE_DOCUMENT", "employee_documents", documentID, toDocResp(*existing), nil)
	return nil
}

func (s *svc) ListServiceYears(ctx context.Context, orgID, employeeID string) ([]response.ServiceYearResponse, *apperrors.Error) {
	if appErr := s.ensureEmployee(ctx, orgID, employeeID); appErr != nil {
		return nil, appErr
	}
	rows, err := s.repo.ListServiceYears(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.ServiceYearResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toServiceYearResp(r))
	}
	return out, nil
}

func (s *svc) RecalculateServiceYear(ctx context.Context, orgID, employeeID string, req request.RecalculateServiceYearRequest, auditCtx audit.RecordInput) (*response.ServiceYearResponse, *apperrors.Error) {
	src, err := s.repo.GetEmployeeSnapshotSource(ctx, orgID, employeeID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Employee not found in organization.")
		}
		return nil, apperrors.Internal()
	}
	if src.DateOfJoining == nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
			Field:   "dateOfJoining",
			Message: "Employee dateOfJoining must be set before calculating service years.",
		}})
	}

	calcDate := time.Now().UTC()
	if req.CalculationDate != nil && strings.TrimSpace(*req.CalculationDate) != "" {
		parsed, parseErr := time.Parse("2006-01-02", strings.TrimSpace(*req.CalculationDate))
		if parseErr != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
				Field:   "calculationDate",
				Message: "calculationDate must be YYYY-MM-DD.",
			}})
		}
		calcDate = parsed
	}
	calcDate = time.Date(calcDate.Year(), calcDate.Month(), calcDate.Day(), 0, 0, 0, 0, time.UTC)

	years := 0.0
	if calcDate.After(*src.DateOfJoining) {
		days := calcDate.Sub(*src.DateOfJoining).Hours() / 24.0
		years = math.Round((days/365.25)*100) / 100
	}

	now := time.Now().UTC()
	m := &models.EmployeeServiceYear{
		OrganizationID:  orgID,
		EmployeeID:      employeeID,
		CalculationDate: calcDate,
		ServiceYears:    years,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	if err := s.repo.UpsertServiceYear(ctx, m); err != nil {
		return nil, apperrors.Internal()
	}
	res := toServiceYearResp(*m)
	s.emitAudit(ctx, auditCtx, orgID, "RECALCULATE_SERVICE_YEAR", "employee_service_years", m.ID, nil, res)
	return &res, nil
}

func (s *svc) ListExitRecords(ctx context.Context, orgID, employeeID string) ([]response.ExitRecordResponse, *apperrors.Error) {
	if appErr := s.ensureEmployee(ctx, orgID, employeeID); appErr != nil {
		return nil, appErr
	}
	rows, err := s.repo.ListExitRecords(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.ExitRecordResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toExitResp(r))
	}
	return out, nil
}

func (s *svc) ListHistories(ctx context.Context, orgID, employeeID string) ([]response.EmployeeHistoryResponse, *apperrors.Error) {
	if appErr := s.ensureEmployee(ctx, orgID, employeeID); appErr != nil {
		return nil, appErr
	}
	rows, err := s.repo.ListHistories(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.EmployeeHistoryResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, response.EmployeeHistoryResponse{
			ID:                 r.ID,
			OrganizationID:     r.OrganizationID,
			EmployeeID:         r.EmployeeID,
			ExitRecordID:       r.ExitRecordID,
			EmployeeSnapshot:   r.EmployeeSnapshot,
			ProfileSnapshot:    r.ProfileSnapshot,
			SnapshotReason:     r.SnapshotReason,
			SnapshotAt:         r.SnapshotAt,
			CreatedByAccountID: r.CreatedByAccountID,
		})
	}
	return out, nil
}

func (s *svc) RecordExit(ctx context.Context, orgID, employeeID, actorAccountID string, req request.RecordExitRequest, auditCtx audit.RecordInput) (*response.ExitRecordResponse, *apperrors.Error) {
	exitType := strings.ToUpper(strings.TrimSpace(req.ExitType))
	var newStatus string
	switch exitType {
	case "RESIGNATION":
		newStatus = "RESIGNED"
	case "TERMINATION", "DISMISSAL", "RETIREMENT", "END_OF_CONTRACT":
		newStatus = "TERMINATED"
	default:
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
			Field:   "exitType",
			Message: "exitType must be RESIGNATION, TERMINATION, DISMISSAL, RETIREMENT, or END_OF_CONTRACT.",
		}})
	}

	effDate, err := time.Parse("2006-01-02", strings.TrimSpace(req.EffectiveDate))
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
			Field:   "effectiveDate",
			Message: "effectiveDate must be YYYY-MM-DD.",
		}})
	}

	src, err := s.repo.GetEmployeeSnapshotSource(ctx, orgID, employeeID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Employee not found in organization.")
		}
		return nil, apperrors.Internal()
	}

	var actorPtr *string
	if actorAccountID != "" {
		actorPtr = &actorAccountID
	}

	now := time.Now().UTC()
	exit := &models.EmployeeExitRecord{
		OrganizationID:      orgID,
		EmployeeID:          employeeID,
		RecordedByAccountID: actorPtr,
		ExitType:            exitType,
		EffectiveDate:       effDate,
		Reason:              req.Reason,
		DecisionStatus:      "RECORDED",
		RecordedAt:          now,
		CreatedAt:           now,
		UpdatedAt:           now,
	}
	hist := &models.EmployeeHistory{
		OrganizationID:     orgID,
		EmployeeID:         employeeID,
		EmployeeSnapshot:   src.EmployeeJSON,
		ProfileSnapshot:    src.ProfileJSON,
		SnapshotReason:     exitType,
		SnapshotAt:         now,
		CreatedByAccountID: actorPtr,
	}

	if err := s.repo.RecordExitWithSnapshot(ctx, exit, hist, newStatus); err != nil {
		return nil, apperrors.Internal()
	}

	res := toExitResp(*exit)
	s.emitAudit(ctx, auditCtx, orgID, "RECORD_EMPLOYEE_EXIT", "employee_exit_records", exit.ID, map[string]any{"employmentStatus": src.Status}, res)
	return &res, nil
}

func (s *svc) emitAudit(ctx context.Context, auditCtx audit.RecordInput, orgID, action, entityName, entityID string, oldVal, newVal any) {
	if s.recorder == nil {
		return
	}
	auditCtx.OrganizationID = orgID
	auditCtx.Action = action
	auditCtx.EntityName = entityName
	auditCtx.EntityID = entityID
	auditCtx.OldValues = oldVal
	auditCtx.NewValues = newVal
	_ = s.recorder.Record(ctx, auditCtx)
}

func toContractResp(m models.EmploymentContract) response.ContractResponse {
	var endStr *string
	if m.EndDate != nil {
		s := m.EndDate.Format("2006-01-02")
		endStr = &s
	}
	return response.ContractResponse{
		ID:             m.ID,
		OrganizationID: m.OrganizationID,
		EmployeeID:     m.EmployeeID,
		ContractType:   m.ContractType,
		StartDate:      m.StartDate.Format("2006-01-02"),
		EndDate:        endStr,
		ContractStatus: m.ContractStatus,
		Notes:          m.Notes,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

func toDocResp(m models.EmployeeDocument) response.DocumentResponse {
	var expStr *string
	if m.ExpiryDate != nil {
		s := m.ExpiryDate.Format("2006-01-02")
		expStr = &s
	}
	return response.DocumentResponse{
		ID:             m.ID,
		OrganizationID: m.OrganizationID,
		EmployeeID:     m.EmployeeID,
		DocumentType:   m.DocumentType,
		DocumentName:   m.DocumentName,
		FileReference:  m.FileReference,
		ExpiryDate:     expStr,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

func toServiceYearResp(m models.EmployeeServiceYear) response.ServiceYearResponse {
	return response.ServiceYearResponse{
		ID:              m.ID,
		OrganizationID:  m.OrganizationID,
		EmployeeID:      m.EmployeeID,
		CalculationDate: m.CalculationDate.Format("2006-01-02"),
		ServiceYears:    m.ServiceYears,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
}

func toExitResp(m models.EmployeeExitRecord) response.ExitRecordResponse {
	return response.ExitRecordResponse{
		ID:                  m.ID,
		OrganizationID:      m.OrganizationID,
		EmployeeID:          m.EmployeeID,
		RecordedByAccountID: m.RecordedByAccountID,
		ExitType:            m.ExitType,
		EffectiveDate:       m.EffectiveDate.Format("2006-01-02"),
		Reason:              m.Reason,
		DecisionStatus:      m.DecisionStatus,
		RecordedAt:          m.RecordedAt,
	}
}
