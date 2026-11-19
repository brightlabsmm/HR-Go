package bump_test

import (
	"context"
	"errors"
	"strings"
	"testing"

	"hrgo/backend/internal/modules/control/patchversion/bump"
)

func TestResolveUsesOnlyTheConfiguredURL(t *testing.T) {
	t.Parallel()

	got, err := bump.Resolve("postgres://app.example/hr")
	if err != nil {
		t.Fatal(err)
	}
	if got != "postgres://app.example/hr" {
		t.Fatalf("url = %s", got)
	}

	_, err = bump.Resolve("   ")
	if !errors.Is(err, bump.ErrMissingDatabaseURL) {
		t.Fatalf("err = %v", err)
	}
}

func TestOpenConfiguredDoesNotTryAnotherDatabase(t *testing.T) {
	t.Parallel()

	authErr := errors.New("password authentication failed")
	calls := 0
	err := bump.OpenConfigured(context.Background(), "postgres://configured.example/hr", func(_ context.Context, url string) error {
		calls++
		if url != "postgres://configured.example/hr" {
			t.Fatalf("opened %s", url)
		}
		if strings.Contains(url, "127.0.0.1:5433") || strings.Contains(url, "/hrgo") {
			t.Fatal("opened a local fallback database")
		}
		return authErr
	})
	if calls != 1 {
		t.Fatalf("open calls = %d, want 1", calls)
	}
	if !errors.Is(err, authErr) {
		t.Fatalf("err = %v", err)
	}
	if !strings.Contains(err.Error(), "no other database was tried") {
		t.Fatalf("err = %v", err)
	}
}
