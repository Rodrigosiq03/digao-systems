package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port             int
	StreamSocketPath string
	FrameRate        int
	AuthMode         string
	AuthDefaultUser  string
	OIDCIssuerURL    string
	OIDCClientID     string
	MaxSessions      int
	LaunchMode       string
	SessionShell     string
	GameCatalog      string
}

func FromEnv() Config {
	return Config{
		Port:             getInt("PORT", 8080),
		StreamSocketPath: getString("STREAM_SOCKET_PATH", "/tmp/digao-cloud-gaming/stream.sock"),
		FrameRate:        getInt("FRAME_RATE", 60),
		AuthMode:         getString("AUTH_MODE", "none"),
		AuthDefaultUser:  getString("AUTH_DEFAULT_USER", "dev-user"),
		OIDCIssuerURL:    getString("OIDC_ISSUER_URL", ""),
		OIDCClientID:     getString("OIDC_CLIENT_ID", ""),
		MaxSessions:      getInt("MAX_CONCURRENT_SESSIONS", 1),
		LaunchMode:       getString("LAUNCH_MODE", "noop"),
		SessionShell:     getString("SESSION_SHELL", "/bin/bash"),
		GameCatalog: getString(
			"GAME_CATALOG",
			"steam-cs2::Counter-Strike 2::FPS competitivo::steam -applaunch 730;steam-dota2::Dota 2::MOBA::steam -applaunch 570",
		),
	}
}

func getInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func getString(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
