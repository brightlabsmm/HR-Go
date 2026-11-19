package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrgo/backend/internal/modules/control/patchversion/models"
	"hrgo/backend/internal/modules/control/patchversion/repository"
	"hrgo/backend/internal/modules/control/patchversion/service"
)

type fakeRepo struct {
	row *models.ApplicationPatchVersion
	err error
}

func (f fakeRepo) FindCurrent(context.Context) (*models.ApplicationPatchVersion, error) {
	return f.row, f.err
}

func (f fakeRepo) Bump(context.Context, time.Time) (*models.ApplicationPatchVersion, error) {
	return nil, errors.New("not used")
}

func TestCurrent(t *testing.T) {
	t.Parallel()

	t.Run("returns the current row", func(t *testing.T) {
		t.Parallel()
		when := time.Date(2026, 11, 19, 8, 14, 0, 0, time.UTC)
		svc := service.New(fakeRepo{row: &models.ApplicationPatchVersion{
			PatchVersion:  "01.00.01",
			PatchDateTime: when,
			IsCurrent:     true,
		}})

		got, appErr := svc.Current(context.Background())
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if got.PatchVersion != "01.00.01" || !got.Current {
			t.Fatalf("got %+v", got)
		}
		if got.PatchDateTime.Format("2006-01-02T15:04:05-07:00") != "2026-11-19T15:14:00+07:00" {
			t.Fatalf("patchDateTime = %s", got.PatchDateTime.Format(time.RFC3339))
		}
	})

	t.Run("missing row is not found", func(t *testing.T) {
		t.Parallel()
		svc := service.New(fakeRepo{})
		_, appErr := svc.Current(context.Background())
		if appErr == nil || appErr.Code != "NOT_FOUND" {
			t.Fatalf("err = %+v, want NOT_FOUND", appErr)
		}
	})

	t.Run("repository failure is internal", func(t *testing.T) {
		t.Parallel()
		svc := service.New(fakeRepo{err: repository.ErrNoCurrent})
		_, appErr := svc.Current(context.Background())
		if appErr == nil || appErr.Code != "INTERNAL_SERVER_ERROR" {
			t.Fatalf("err = %+v, want INTERNAL_SERVER_ERROR", appErr)
		}
	})
}
