package security_test

import (
	"testing"
	"time"

	"hrgo/backend/internal/shared/security"
)

func TestLockoutManager(t *testing.T) {
	t.Run("locks out after max failed attempts", func(t *testing.T) {
		lm := security.NewLockoutManager(3, 100*time.Millisecond)
		ident := "EMP-TEST-001"

		if lm.IsLocked(ident) {
			t.Fatal("expected not locked initially")
		}

		if lm.RecordFailure(ident) {
			t.Fatal("expected not locked on 1st failure")
		}
		if lm.RecordFailure(ident) {
			t.Fatal("expected not locked on 2nd failure")
		}
		if !lm.RecordFailure(ident) {
			t.Fatal("expected locked on 3rd failure")
		}

		if !lm.IsLocked(ident) {
			t.Fatal("expected IsLocked to return true")
		}

		// Case-insensitive
		if !lm.IsLocked("emp-test-001") {
			t.Fatal("expected IsLocked to be case-insensitive")
		}

		// Wait for expiration
		time.Sleep(120 * time.Millisecond)

		if lm.IsLocked(ident) {
			t.Fatal("expected lock to expire after duration")
		}
	})

	t.Run("reset clears failure records on success", func(t *testing.T) {
		lm := security.NewLockoutManager(3, 10*time.Minute)
		ident := "EMP-TEST-002"

		lm.RecordFailure(ident)
		lm.RecordFailure(ident)
		lm.Reset(ident)

		// 2 more failures should not lock because counter was reset
		lm.RecordFailure(ident)
		if lm.RecordFailure(ident) {
			t.Fatal("expected counter to have been reset")
		}
	})
}
