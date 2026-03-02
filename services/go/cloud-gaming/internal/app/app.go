package app

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/digao/cloud-gaming/internal/config"
	"github.com/digao/cloud-gaming/internal/httpserver"
	"github.com/digao/cloud-gaming/internal/input"
	"github.com/digao/cloud-gaming/internal/stream"
	webrtcgateway "github.com/digao/cloud-gaming/internal/webrtc"
)

type App struct {
	cfg config.Config
}

func New(cfg config.Config) *App {
	return &App{cfg: cfg}
}

func (a *App) Run(ctx context.Context) error {
	streamBroker := stream.NewBroker()
	ipcReceiver := stream.NewIPCReceiver(a.cfg.StreamSocketPath, streamBroker)
	inputHandler := input.NewHandler()
	gateway := webrtcgateway.NewGateway(streamBroker, inputHandler, a.cfg.FrameRate)

	go func() {
		if err := ipcReceiver.Run(ctx); err != nil {
			log.Printf("ipc receiver stopped with error: %v", err)
		}
	}()

	handler := httpserver.NewRouter(gateway.ServeWS)
	server := &http.Server{
		Addr:              fmt.Sprintf(":%d", a.cfg.Port),
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		err := server.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
			return
		}
		errCh <- nil
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return err
	}

	return <-errCh
}
