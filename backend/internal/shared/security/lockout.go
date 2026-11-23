package security

import (
	"strings"
	"sync"
	"time"
)

type attemptRecord struct {
	count       int
	lockedUntil time.Time
}

// LockoutManager tracks failed authentication attempts and temporarily locks out accounts.
type LockoutManager struct {
	mu           sync.RWMutex
	maxAttempts  int
	lockDuration time.Duration
	attempts     map[string]*attemptRecord
}

// NewLockoutManager creates a LockoutManager with the specified max attempts and lock duration.
func NewLockoutManager(maxAttempts int, lockDuration time.Duration) *LockoutManager {
	if maxAttempts <= 0 {
		maxAttempts = 5
	}
	if lockDuration <= 0 {
		lockDuration = 15 * time.Minute
	}
	return &LockoutManager{
		maxAttempts:  maxAttempts,
		lockDuration: lockDuration,
		attempts:     make(map[string]*attemptRecord),
	}
}

func normalizeKey(identifier string) string {
	return strings.ToLower(strings.TrimSpace(identifier))
}

// IsLocked checks whether the identifier is currently locked out.
func (lm *LockoutManager) IsLocked(identifier string) bool {
	if lm == nil {
		return false
	}
	key := normalizeKey(identifier)
	if key == "" {
		return false
	}

	lm.mu.Lock()
	defer lm.mu.Unlock()

	rec, exists := lm.attempts[key]
	if !exists {
		return false
	}

	if !rec.lockedUntil.IsZero() {
		if time.Now().UTC().Before(rec.lockedUntil) {
			return true
		}
		// Lock expired, reset record
		delete(lm.attempts, key)
		return false
	}

	return false
}

// RecordFailure records a failed login attempt and returns true if the account is now locked.
func (lm *LockoutManager) RecordFailure(identifier string) bool {
	if lm == nil {
		return false
	}
	key := normalizeKey(identifier)
	if key == "" {
		return false
	}

	lm.mu.Lock()
	defer lm.mu.Unlock()

	now := time.Now().UTC()
	rec, exists := lm.attempts[key]
	if !exists {
		rec = &attemptRecord{}
		lm.attempts[key] = rec
	}

	if !rec.lockedUntil.IsZero() && now.Before(rec.lockedUntil) {
		return true
	}

	rec.count++
	if rec.count >= lm.maxAttempts {
		rec.lockedUntil = now.Add(lm.lockDuration)
		return true
	}

	return false
}

// Reset clears failure records upon successful login.
func (lm *LockoutManager) Reset(identifier string) {
	if lm == nil {
		return
	}
	key := normalizeKey(identifier)
	if key == "" {
		return
	}

	lm.mu.Lock()
	defer lm.mu.Unlock()

	delete(lm.attempts, key)
}
