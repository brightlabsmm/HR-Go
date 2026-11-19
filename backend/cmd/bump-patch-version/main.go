package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"hrgo/backend/internal/config"
	"hrgo/backend/internal/database"
	"hrgo/backend/internal/modules/control/patchversion/repository"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("bump patch version: load config: %v", err)
	}
	if cfg.DatabaseURL == "" {
		log.Fatal("bump patch version: DATABASE_URL is required (environment or backend/.env)")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("bump patch version: open database: %v", err)
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
