package app

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/digao/cloud-gaming/internal/auth"
	"github.com/digao/cloud-gaming/internal/config"
	"github.com/digao/cloud-gaming/internal/httpserver"
	"github.com/digao/cloud-gaming/internal/hub"
	"github.com/digao/cloud-gaming/internal/input"
	"github.com/digao/cloud-gaming/internal/stream"
	webrtcgateway "github.com/digao/cloud-gaming/internal/webrtc"
)

type App struct {
	cfg           config.Config
	authenticator *auth.Authenticator
	sessions      *hub.SessionManager
}

func New(cfg config.Config) *App {
	return &App{cfg: cfg}
}

func (a *App) Run(ctx context.Context) error {
	authenticator, err := auth.NewAuthenticator(ctx, auth.Config{
		Mode:         a.cfg.AuthMode,
		DefaultUser:  a.cfg.AuthDefaultUser,
		OIDCIssuer:   a.cfg.OIDCIssuerURL,
		OIDCClientID: a.cfg.OIDCClientID,
	})
	if err != nil {
		return fmt.Errorf("configure authenticator: %w", err)
	}
	a.authenticator = authenticator

	catalog, err := hub.ParseCatalog(a.cfg.GameCatalog)
	if err != nil {
		return fmt.Errorf("parse game catalog: %w", err)
	}

	a.sessions = hub.NewSessionManager(a.cfg.MaxSessions, a.cfg.LaunchMode, a.cfg.SessionShell, catalog)
	defer a.sessions.Close()

	streamBroker := stream.NewBroker()
	ipcReceiver := stream.NewIPCReceiver(a.cfg.StreamSocketPath, streamBroker)
	inputHandler := input.NewHandler()
	gateway := webrtcgateway.NewGateway(streamBroker, inputHandler, a.cfg.FrameRate)

	go func() {
		if err := ipcReceiver.Run(ctx); err != nil {
			log.Printf("ipc receiver stopped with error: %v", err)
		}
	}()

	wsHandler := func(w http.ResponseWriter, r *http.Request) {
		claims, ok := a.authenticateOrWrite(w, r)
		if !ok {
			return
		}
		if _, found := a.sessions.GetSessionForUser(claims.Subject); !found {
			writeJSON(w, http.StatusConflict, apiError{Error: "start a game session before opening stream"})
			return
		}
		gateway.ServeWS(w, r)
	}

	handler := httpserver.NewRouter(httpserver.Handlers{
		SignalingWS:  wsHandler,
		Hub:          a.handleHub,
		SessionStart: a.handleStartSession,
		SessionStop:  a.handleStopSession,
		SessionMe:    a.handleSessionMe,
		AuthMe:       a.handleAuthMe,
	})
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
