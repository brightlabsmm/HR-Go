package scheduler_test

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"

	"hrgo/backend/internal/scheduler"
)

type mockSuspender struct {
	processedIDs []string
	err          error
	callCount    int
}

func (m *mockSuspender) ProcessDueSuspensions(ctx context.Context) ([]string, error) {
	m.callCount++
	return m.processedIDs, m.err
}

func TestOrgSuspendScheduler(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))

	t.Run("runs initial check and processes due suspensions", func(t *testing.T) {
		susp := &mockSuspender{
			processedIDs: []string{"org-1", "org-2"},
		}
		sched := scheduler.NewOrgSuspendScheduler(susp, 50*time.Millisecond, logger)

		ctx, cancel := context.WithTimeout(context.Background(), 120*time.Millisecond)
		defer cancel()

		sched.Run(ctx)

		if susp.callCount < 1 {
			t.Errorf("expected at least 1 call, got %d", susp.callCount)
		}
	})

	t.Run("handles error gracefully without crashing", func(t *testing.T) {
		susp := &mockSuspender{
			err: errors.New("db error"),
		}
		sched := scheduler.NewOrgSuspendScheduler(susp, 50*time.Millisecond, logger)

		ctx, cancel := context.WithTimeout(context.Background(), 70*time.Millisecond)
		defer cancel()

		sched.Run(ctx)

		if susp.callCount < 1 {
			t.Errorf("expected at least 1 call, got %d", susp.callCount)
		}
	})
}
