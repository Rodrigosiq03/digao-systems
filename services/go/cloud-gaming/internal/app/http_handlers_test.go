package app

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/digao/cloud-gaming/internal/auth"
	"github.com/digao/cloud-gaming/internal/config"
	"github.com/digao/cloud-gaming/internal/hub"
)

func TestHandleHubIncludesAuthModeForProxyUI(t *testing.T) {
	t.Parallel()

	authenticator, err := auth.NewAuthenticator(context.Background(), auth.Config{Mode: auth.ModeProxy})
	if err != nil {
		t.Fatalf("NewAuthenticator() error = %v", err)
	}

	app := &App{
		cfg: config.Config{
			AuthMode:       auth.ModeProxy,
			StreamProvider: "sunshine",
		},
		authenticator: authenticator,
		sessions: hub.NewSessionManager(1, "noop", "/bin/bash", []hub.Game{
			{
				ID:             "gow3",
				Name:           "God of War III",
				Description:    "RPCS3",
				Platform:       "rpcs3",
				StreamProvider: "sunshine",
				Command:        "noop",
				Enabled:        true,
			},
		}),
	}
	t.Cleanup(app.sessions.Close)

	req := httptest.NewRequest(http.MethodGet, "/api/hub", nil)
	req.Header.Set("X-Forwarded-User", "rodrigo")
	req.Header.Set("X-Forwarded-Email", "rodrigo@example.com")
	recorder := httptest.NewRecorder()

	app.handleHub(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("handleHub() status = %d, want %d", recorder.Code, http.StatusOK)
	}

	var payload map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}

	authBlock, ok := payload["auth"].(map[string]any)
	if !ok {
		t.Fatalf("auth block missing or invalid: %#v", payload["auth"])
	}

	if got := authBlock["mode"]; got != auth.ModeProxy {
		t.Fatalf("auth.mode = %#v, want %q", got, auth.ModeProxy)
	}
}
