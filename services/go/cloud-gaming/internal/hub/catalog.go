package hub

import (
	"fmt"
	"strings"
)

const defaultCatalog = "steam-cs2::Counter-Strike 2::FPS competitivo::steam -applaunch 730;steam-dota2::Dota 2::MOBA::steam -applaunch 570"

type Game struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Command     string `json:"-"`
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
		parts := strings.SplitN(entry, "::", 4)
		if len(parts) != 4 {
			return nil, fmt.Errorf("invalid game entry: %q", entry)
		}
		game := Game{
			ID:          strings.TrimSpace(parts[0]),
			Name:        strings.TrimSpace(parts[1]),
			Description: strings.TrimSpace(parts[2]),
			Command:     strings.TrimSpace(parts[3]),
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
