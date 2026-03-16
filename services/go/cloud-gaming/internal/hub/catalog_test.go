package hub

import (
	"encoding/json"
	"path/filepath"
	"testing"
)

func TestLoadCatalogFileSkipsDisabledEntries(t *testing.T) {
	path := filepath.Join("testdata", "catalog.dev-v1.json")
	games, err := LoadCatalog(path, "")
	if err != nil {
		t.Fatalf("LoadCatalog returned error: %v", err)
	}

	if got, want := len(games), 3; got != want {
		t.Fatalf("expected %d enabled games, got %d", want, got)
	}
}

func TestLoadCatalogFilePreservesPlatformAndProvider(t *testing.T) {
	path := filepath.Join("testdata", "catalog.dev-v1.json")
	games, err := LoadCatalog(path, "")
	if err != nil {
		t.Fatalf("LoadCatalog returned error: %v", err)
	}

	if len(games) == 0 {
		t.Fatalf("expected non-empty catalog")
	}

	first := games[0]
	if first.Platform == "" {
		t.Fatalf("expected platform metadata to be populated")
	}
	if first.StreamProvider == "" {
		t.Fatalf("expected stream provider metadata to be populated")
	}
}

func TestParseCatalogWithOptionalStopCommand(t *testing.T) {
	raw := "steam-cs2::Counter-Strike 2::FPS::steam -applaunch 730::steam steam://close/bigpicture"
	games, err := ParseCatalog(raw)
	if err != nil {
		t.Fatalf("ParseCatalog returned error: %v", err)
	}

	if len(games) != 1 {
		t.Fatalf("expected 1 game, got %d", len(games))
	}
	if games[0].StopCommand == "" {
		t.Fatalf("expected stop command to be parsed")
	}
}

func TestParseCatalogRejectsInvalidEntry(t *testing.T) {
	raw := "steam-cs2::Counter-Strike 2::FPS"
	_, err := ParseCatalog(raw)
	if err == nil {
		t.Fatalf("expected ParseCatalog to fail for invalid entry")
	}
}

func TestGameJSONDoesNotExposeCommand(t *testing.T) {
	payload, err := json.Marshal(Game{
		ID:             "weed-shop-3",
		Name:           "Weed Shop 3",
		Description:    "Steam",
		Platform:       "steam",
		StreamProvider: "sunshine",
		Command:        "/secret/launcher",
	})
	if err != nil {
		t.Fatalf("Marshal returned error: %v", err)
	}

	if string(payload) == "" {
		t.Fatalf("expected non-empty payload")
	}
	if contains := string(payload); contains != "" && filepath.Base("/secret/launcher") == "launcher" && string(payload) != "" {
		if string(payload) != "" && jsonContainsKey(payload, "command") {
			t.Fatalf("expected command field to stay private, payload=%s", string(payload))
		}
	}
}

func jsonContainsKey(payload []byte, key string) bool {
	var decoded map[string]any
	if err := json.Unmarshal(payload, &decoded); err != nil {
		return false
	}
	_, ok := decoded[key]
	return ok
}
