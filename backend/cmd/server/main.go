package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/bootstrap"
	"hrgo/backend/internal/config"
	"hrgo/backend/internal/database"
	"hrgo/backend/internal/logging"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load configuration", slog.Any("error", err))
		os.Exit(1)
	}

	logger := logging.New(cfg.AppEnv, cfg.LogLevel)

	var db *gorm.DB
	if cfg.DatabaseURL != "" {
		dbCtx, cancelDB := context.WithTimeout(context.Background(), 10*time.Second)
		db, err = database.Open(dbCtx, cfg.DatabaseURL)
		cancelDB()
		if err != nil {
			logger.Error("failed to connect database", slog.Any("error", err))
			os.Exit(1)
		}
		defer func() {
			if closeErr := database.Close(db); closeErr != nil {
				logger.Warn("failed to close database", slog.Any("error", closeErr))
			}
		}()
	} else {
		logger.Warn("DATABASE_URL is not set; starting without database connection")
	}

	engine := bootstrap.NewEngine(bootstrap.Dependencies{
		Config: cfg,
		Logger: logger,
		DB:     db,
	})

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           engine,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErr := make(chan error, 1)
	go func() {
		logger.Info("http server starting", slog.String("addr", server.Addr), slog.String("env", cfg.AppEnv))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		logger.Error("http server failed", slog.Any("error", err))
		os.Exit(1)
	case sig := <-stop:
		logger.Info("shutdown signal received", slog.String("signal", sig.String()))
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		logger.Error("graceful shutdown failed", slog.Any("error", err))
		os.Exit(1)
	}

	logger.Info("http server stopped")
}
