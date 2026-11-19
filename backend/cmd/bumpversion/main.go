package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/config"
	"hrgo/backend/internal/database"
	"hrgo/backend/internal/modules/control/patchversion/bump"
	"hrgo/backend/internal/modules/control/patchversion/repository"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("bump patch version: load config: %v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// One configured URL only. Authentication failure stops the push.
	var db *gorm.DB
	err = bump.OpenConfigured(ctx, cfg.DatabaseURL, func(ctx context.Context, databaseURL string) error {
		opened, openErr := database.Open(ctx, databaseURL)
		if openErr != nil {
			return openErr
		}
		db = opened
		return nil
	})
	if err != nil {
		log.Fatalf("bump patch version: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("bump patch version: database pool: %v", err)
	}
	defer sqlDB.Close()

	row, err := repository.New(db).Bump(ctx, time.Now())
	if err != nil {
		log.Fatalf("bump patch version: %v", err)
	}

	fmt.Fprintf(os.Stdout, "application patch version %s is now current\n", row.PatchVersion)
}
