package bump

import (
	"context"
	"errors"
	"fmt"
	"strings"
)

// ErrMissingDatabaseURL means neither the environment nor backend/.env set DATABASE_URL.
var ErrMissingDatabaseURL = errors.New("DATABASE_URL is required (environment or backend/.env)")

// Resolve returns the single configured database URL.
// An empty value is an error. There is no local default.
func Resolve(databaseURL string) (string, error) {
	databaseURL = strings.TrimSpace(databaseURL)
	if databaseURL == "" {
		return "", ErrMissingDatabaseURL
	}
	return databaseURL, nil
}

// OpenConfigured opens databaseURL once.
// A connection or authentication error is returned and no other database is opened.
func OpenConfigured(ctx context.Context, databaseURL string, open func(context.Context, string) error) error {
	target, err := Resolve(databaseURL)
	if err != nil {
		return err
	}
	if err := open(ctx, target); err != nil {
		return fmt.Errorf("configured database rejected the connection; no other database was tried: %w", err)
	}
	return nil
}
