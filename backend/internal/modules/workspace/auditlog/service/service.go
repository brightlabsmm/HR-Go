package service

import (
	"context"

	"hrgo/backend/internal/modules/workspace/auditlog/repository"
	"hrgo/backend/internal/modules/workspace/auditlog/request"
	"hrgo/backend/internal/modules/workspace/auditlog/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	List(ctx context.Context, orgID string, q request.ListAuditLogsQuery) ([]response.AuditLogResponse, int64, *apperrors.Error)
}

type svc struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &svc{repo: repo}
}

func (s *svc) List(ctx context.Context, orgID string, q request.ListAuditLogsQuery) ([]response.AuditLogResponse, int64, *apperrors.Error) {
	rows, total, err := s.repo.List(ctx, orgID, q)
	if err != nil {
		return nil, 0, apperrors.Internal()
	}

	items := make([]response.AuditLogResponse, 0, len(rows))
	for _, r := range rows {
		items = append(items, response.AuditLogResponse{
			ID:             r.ID,
			OrganizationID: r.OrganizationID,
			ActorID:        r.ActorID,
			ActorType:      r.ActorType,
			ActorName:      r.ActorName,
			ActorCode:      r.ActorCode,
			Action:         r.Action,
			EntityName:     r.EntityName,
			EntityID:       r.EntityID,
			OldValues:      r.OldValues,
			NewValues:      r.NewValues,
			Details:        r.Details,
			ClientIP:       r.ClientIP,
			UserAgent:      r.UserAgent,
			CreatedAt:      r.CreatedAt,
		})
	}
	return items, total, nil
}
