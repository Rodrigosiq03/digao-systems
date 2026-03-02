package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"github.com/digao/cloud-gaming/internal/app"
	"github.com/digao/cloud-gaming/internal/config"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg := config.FromEnv()
	application := app.New(cfg)

	if err := application.Run(ctx); err != nil {
		log.Fatalf("application error: %v", err)
	}
}
