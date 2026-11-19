package repository_test

import (
	"errors"
	"testing"

	"hrgo/backend/internal/modules/control/patchversion/repository"
)

func TestNextPatchVersion(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name    string
		current string
		want    string
		err     error
	}{
		{name: "increments patch", current: "01.00.01", want: "01.00.02"},
		{name: "rolls patch tens", current: "01.00.09", want: "01.00.10"},
		{name: "carries into minor", current: "01.00.99", want: "01.01.00"},
		{name: "carries into major", current: "01.99.99", want: "02.00.00"},
		{name: "starts from zero", current: "00.00.00", want: "00.00.01"},
		{name: "overflow", current: "99.99.99", err: repository.ErrOverflow},
		{name: "missing zeros", current: "1.00.01", err: repository.ErrInvalidVersion},
		{name: "too short", current: "01.00.1", err: repository.ErrInvalidVersion},
		{name: "empty", current: "", err: repository.ErrInvalidVersion},
		{name: "letters", current: "0a.00.01", err: repository.ErrInvalidVersion},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got, err := repository.NextPatchVersion(tc.current)
			if tc.err != nil {
				if !errors.Is(err, tc.err) {
					t.Fatalf("err = %v, want %v", err, tc.err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected err: %v", err)
			}
			if got != tc.want {
				t.Fatalf("next = %s, want %s", got, tc.want)
			}
		})
	}
}
