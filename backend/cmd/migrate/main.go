package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"hrgo/backend/internal/config"
	"hrgo/backend/internal/database"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required to run migrations")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get sql.DB: %v", err)
	}
	defer sqlDB.Close()

	if _, err := sqlDB.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`); err != nil {
		log.Fatalf("failed to create schema_migrations table: %v", err)
	}

	files, err := migrationFiles()
	if err != nil {
		log.Fatalf("failed to read migration files: %v", err)
	}

	for _, path := range files {
		name := filepath.Base(path)
		var applied int
		if err := sqlDB.QueryRowContext(ctx, `SELECT COUNT(*) FROM schema_migrations WHERE filename = $1`, name).Scan(&applied); err != nil {
			log.Fatalf("failed to check migration status for %s: %v", name, err)
		}
		if applied > 0 {
			log.Printf("migration already applied, skipping: %s", name)
			continue
		}

		body, err := os.ReadFile(path)
		if err != nil {
			log.Fatalf("failed to read %s: %v", path, err)
		}

		tx, err := sqlDB.BeginTx(ctx, nil)
		if err != nil {
			log.Fatalf("failed to begin transaction for %s: %v", name, err)
		}

		for _, stmt := range splitSQL(string(body)) {
			if _, err := tx.ExecContext(ctx, stmt); err != nil {
				_ = tx.Rollback()
				log.Fatalf("migration %s failed: %v (rolled back)\nStatement:\n%s", name, err, stmt)
			}
		}

		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations (filename) VALUES ($1)`, name); err != nil {
			_ = tx.Rollback()
			log.Fatalf("failed to record migration %s: %v", name, err)
		}

		if err := tx.Commit(); err != nil {
			log.Fatalf("failed to commit migration %s: %v", name, err)
		}
		log.Printf("successfully applied migration: %s", name)
	}

	log.Println("all migrations applied successfully")
}

func migrationFiles() ([]string, error) {
	dirs := []string{
		"migrations",
		filepath.Join("backend", "migrations"),
	}
	for _, dir := range dirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		var files []string
		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
				continue
			}
			files = append(files, filepath.Join(dir, entry.Name()))
		}
		sort.Strings(files)
		if len(files) > 0 {
			return files, nil
		}
	}
	return nil, os.ErrNotExist
}

func splitSQL(body string) []string {
	var statements []string
	var current strings.Builder
	inDollar := false

	for i := 0; i < len(body); i++ {
		if i+1 < len(body) && body[i] == '$' && body[i+1] == '$' {
			inDollar = !inDollar
			current.WriteString("$$")
			i++
			continue
		}
		if body[i] == ';' && !inDollar {
			stmt := strings.TrimSpace(current.String())
			if stmt != "" {
				statements = append(statements, stmt)
			}
			current.Reset()
			continue
		}
		current.WriteByte(body[i])
	}
	stmt := strings.TrimSpace(current.String())
	if stmt != "" {
		statements = append(statements, stmt)
	}
	return statements
}
