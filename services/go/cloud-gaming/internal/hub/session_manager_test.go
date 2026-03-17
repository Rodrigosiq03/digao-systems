package hub

import (
	"testing"
	"time"
)

func TestStartSessionCarriesStreamProvider(t *testing.T) {
	manager := NewSessionManager(1, "noop", "/bin/bash", "", true, []Game{
		{
			ID:             "weed-shop-3",
			Name:           "Weed Shop 3",
			Platform:       "steam",
			StreamProvider: "sunshine",
			Command:        "true",
		},
	})

	session, err := manager.StartSession(UserIdentity{ID: "u1", Username: "u1"}, "weed-shop-3")
	if err != nil {
		t.Fatalf("StartSession returned error: %v", err)
	}

	if session.StreamProvider != "sunshine" {
		t.Fatalf("expected sunshine provider, got %q", session.StreamProvider)
	}
	if session.Platform != "steam" {
		t.Fatalf("expected steam platform, got %q", session.Platform)
	}
}

func TestRenderLaunchCommandWithGameIDPlaceholder(t *testing.T) {
	manager := NewSessionManager(1, "exec", "/bin/bash", "/tmp/launch.sh --game-id {game_id} --command {command}", true, []Game{
		{ID: "weed-shop-3", Name: "Weed Shop 3", Command: "steam -applaunch 1182110"},
	})

	got := manager.renderLaunchCommand("steam -applaunch 1182110", "weed-shop-3")
	want := "/tmp/launch.sh --game-id 'weed-shop-3' --command 'steam -applaunch 1182110'"
	if got != want {
		t.Fatalf("unexpected command rendering. got=%q want=%q", got, want)
	}
}

func TestSessionCanRemainActiveWhenProcessExits(t *testing.T) {
	manager := NewSessionManager(1, "exec", "/bin/bash", "", false, []Game{
		{ID: "g1", Name: "Game 1", Command: "true"},
	})
	defer manager.Close()

	session, err := manager.StartSession(UserIdentity{ID: "u1", Username: "u1"}, "g1")
	if err != nil {
		t.Fatalf("StartSession returned error: %v", err)
	}

	time.Sleep(120 * time.Millisecond)
	if _, ok := manager.GetSessionForUser("u1"); !ok {
		t.Fatalf("expected session %s to remain active after command exit", session.ID)
	}
}
