package service

import (
	"context"
	"regexp"
	"strings"

	"hrgo/backend/internal/modules/workspace/branchhours/models"
	"hrgo/backend/internal/modules/workspace/branchhours/repository"
	"hrgo/backend/internal/modules/workspace/branchhours/request"
	"hrgo/backend/internal/modules/workspace/branchhours/response"
	"hrgo/backend/internal/shared/audit"
	apperrors "hrgo/backend/internal/shared/errors"
)

var hhmmRegex = regexp.MustCompile(`^([01]\d|2[0-3]):[0-5]\d$`)

var validDays = map[string]bool{
	"MONDAY": true, "TUESDAY": true, "WEDNESDAY": true,
	"THURSDAY": true, "FRIDAY": true, "SATURDAY": true, "SUNDAY": true,
}

type Service interface {
	List(ctx context.Context, orgID, branchID string) ([]response.BranchOperatingHourResponse, *apperrors.Error)
	Upsert(ctx context.Context, orgID, branchID string, req request.UpsertBranchOperatingHoursRequest, auditCtx audit.RecordInput) ([]response.BranchOperatingHourResponse, *apperrors.Error)
}

type svc struct {
	repo     repository.Repository
	recorder audit.Recorder
}

func New(repo repository.Repository, recorder audit.Recorder) Service {
	return &svc{repo: repo, recorder: recorder}
}

func (s *svc) List(ctx context.Context, orgID, branchID string) ([]response.BranchOperatingHourResponse, *apperrors.Error) {
	ok, err := s.repo.ValidateBranch(ctx, orgID, branchID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if !ok {
		return nil, apperrors.NotFound("Branch not found in organization.")
	}

	rows, err := s.repo.ListByBranch(ctx, orgID, branchID)
	if err != nil {
		return nil, apperrors.Internal()
	}

	out := make([]response.BranchOperatingHourResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toResponse(r))
	}
	return out, nil
}

func (s *svc) Upsert(ctx context.Context, orgID, branchID string, req request.UpsertBranchOperatingHoursRequest, auditCtx audit.RecordInput) ([]response.BranchOperatingHourResponse, *apperrors.Error) {
	ok, err := s.repo.ValidateBranch(ctx, orgID, branchID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if !ok {
		return nil, apperrors.NotFound("Branch not found in organization.")
	}

	seen := make(map[string]bool, len(req.Hours))
	items := make([]models.BranchOperatingHour, 0, len(req.Hours))
	for _, h := range req.Hours {
		dow := strings.ToUpper(strings.TrimSpace(h.DayOfWeek))
		if !validDays[dow] {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
				Field:   "hours",
				Message: "dayOfWeek must be MONDAY through SUNDAY.",
			}})
		}
		if seen[dow] {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
				Field:   "hours",
				Message: "Each day of week may only appear once.",
			}})
		}
		seen[dow] = true

		if !h.IsClosed {
			if h.OpeningTime == nil || !hhmmRegex.MatchString(strings.TrimSpace(*h.OpeningTime)) {
				return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
					Field:   "openingTime",
					Message: "openingTime must use HH:MM format when branch is open.",
				}})
			}
			if h.ClosingTime == nil || !hhmmRegex.MatchString(strings.TrimSpace(*h.ClosingTime)) {
				return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{
					Field:   "closingTime",
					Message: "closingTime must use HH:MM format when branch is open.",
				}})
			}
		}

		items = append(items, models.BranchOperatingHour{
			DayOfWeek:   dow,
			OpeningTime: h.OpeningTime,
			ClosingTime: h.ClosingTime,
			IsClosed:    h.IsClosed,
		})
	}

	existing, _ := s.repo.ListByBranch(ctx, orgID, branchID)
	saved, err := s.repo.ReplaceForBranch(ctx, orgID, branchID, items)
	if err != nil {
		return nil, apperrors.Internal()
	}

	out := make([]response.BranchOperatingHourResponse, 0, len(saved))
	for _, r := range saved {
		out = append(out, toResponse(r))
	}

	if s.recorder != nil {
		auditCtx.OrganizationID = orgID
		auditCtx.Action = "UPSERT_OPERATING_HOURS"
		auditCtx.EntityName = "branch_operating_hours"
		auditCtx.EntityID = branchID
		auditCtx.OldValues = existing
		auditCtx.NewValues = out
		_ = s.recorder.Record(ctx, auditCtx)
	}

	return out, nil
}

func toResponse(m models.BranchOperatingHour) response.BranchOperatingHourResponse {
	return response.BranchOperatingHourResponse{
		ID:             m.ID,
		OrganizationID: m.OrganizationID,
		BranchID:       m.BranchID,
		DayOfWeek:      m.DayOfWeek,
		OpeningTime:    m.OpeningTime,
		ClosingTime:    m.ClosingTime,
		IsClosed:       m.IsClosed,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}
