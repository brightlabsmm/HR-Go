package scheduler

import (
	"context"
	"log/slog"
	"time"
)

type OrganizationSuspender interface {
	ProcessDueSuspensions(ctx context.Context) ([]string, error)
}

type OrgSuspendScheduler struct {
	suspender OrganizationSuspender
	interval  time.Duration
	logger    *slog.Logger
}

func NewOrgSuspendScheduler(suspender OrganizationSuspender, interval time.Duration, logger *slog.Logger) *OrgSuspendScheduler {
	if interval <= 0 {
		interval = 30 * time.Second
	}
	if logger == nil {
		logger = slog.Default()
	}
	return &OrgSuspendScheduler{
		suspender: suspender,
		interval:  interval,
		logger:    logger,
	}
}

func (s *OrgSuspendScheduler) Run(ctx context.Context) {
	s.logger.Info("organization suspension scheduler started", slog.Duration("interval", s.interval))
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	s.execute(ctx)

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("organization suspension scheduler stopped")
			return
		case <-ticker.C:
			s.execute(ctx)
		}
	}
}

func (s *OrgSuspendScheduler) execute(ctx context.Context) {
	suspendedIDs, err := s.suspender.ProcessDueSuspensions(ctx)
	if err != nil {
		s.logger.Error("organization suspension scheduler failed", slog.Any("error", err))
		return
	}
	if len(suspendedIDs) > 0 {
		s.logger.Info("organization suspension scheduler processed due suspensions",
			slog.Int("count", len(suspendedIDs)),
			slog.Any("organization_ids", suspendedIDs),
		)
	}
}
