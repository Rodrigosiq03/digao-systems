package hub

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

const defaultCatalog = "steam-cs2::Counter-Strike 2::FPS competitivo::steam -applaunch 730;steam-dota2::Dota 2::MOBA::steam -applaunch 570"

type Game struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	Platform       string `json:"platform,omitempty"`
	StreamProvider string `json:"streamProvider,omitempty"`
	Enabled        bool   `json:"enabled,omitempty"`
	Command        string `json:"-"`
	StopCommand    string `json:"-"`
}

type catalogFileEntry struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	Platform       string `json:"platform,omitempty"`
	StreamProvider string `json:"streamProvider,omitempty"`
	Enabled        bool   `json:"enabled,omitempty"`
	Command        string `json:"command,omitempty"`
	StopCommand    string `json:"stopCommand,omitempty"`
}

func ParseCatalog(raw string) ([]Game, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		value = defaultCatalog
	}

	entries := strings.Split(value, ";")
	games := make([]Game, 0, len(entries))
	seen := map[string]struct{}{}

	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		parts := strings.SplitN(entry, "::", 5)
		if len(parts) < 4 {
			return nil, fmt.Errorf("invalid game entry: %q", entry)
		}
		game := Game{
			ID:          strings.TrimSpace(parts[0]),
			Name:        strings.TrimSpace(parts[1]),
			Description: strings.TrimSpace(parts[2]),
			Command:     strings.TrimSpace(parts[3]),
			Enabled:     true,
		}
		if len(parts) == 5 {
			game.StopCommand = strings.TrimSpace(parts[4])
		}
		if game.ID == "" || game.Name == "" || game.Command == "" {
			return nil, fmt.Errorf("invalid game entry (required fields): %q", entry)
		}
		if _, ok := seen[game.ID]; ok {
			return nil, fmt.Errorf("duplicated game id: %s", game.ID)
		}
		seen[game.ID] = struct{}{}
		games = append(games, game)
	}

	if len(games) == 0 {
		return nil, fmt.Errorf("game catalog is empty")
	}

	return games, nil
}

func LoadCatalog(filePath, raw string) ([]Game, error) {
	if strings.TrimSpace(filePath) == "" {
		return ParseCatalog(raw)
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("read catalog file: %w", err)
	}

	var catalog []catalogFileEntry
	if err := json.Unmarshal(data, &catalog); err != nil {
		return nil, fmt.Errorf("decode catalog file: %w", err)
	}

	games := make([]Game, 0, len(catalog))
	seen := map[string]struct{}{}
	for _, entry := range catalog {
		if !entry.Enabled {
			continue
		}
		game := Game{
			ID:             strings.TrimSpace(entry.ID),
			Name:           strings.TrimSpace(entry.Name),
			Description:    strings.TrimSpace(entry.Description),
			Platform:       strings.TrimSpace(entry.Platform),
			StreamProvider: strings.TrimSpace(entry.StreamProvider),
			Enabled:        true,
			Command:        strings.TrimSpace(entry.Command),
			StopCommand:    strings.TrimSpace(entry.StopCommand),
		}
		if game.ID == "" || game.Name == "" || game.Command == "" {
			return nil, fmt.Errorf("invalid enabled game entry in catalog file: %q", game.ID)
		}
		if _, ok := seen[game.ID]; ok {
			return nil, fmt.Errorf("duplicated game id: %s", game.ID)
		}
		seen[game.ID] = struct{}{}
		games = append(games, game)
	}

	if len(games) == 0 {
		return nil, fmt.Errorf("game catalog is empty")
	}

	return games, nil
}
