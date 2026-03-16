package hub

import "testing"

func TestStartSessionCarriesStreamProvider(t *testing.T) {
	manager := NewSessionManager(1, "noop", "/bin/bash", []Game{
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
