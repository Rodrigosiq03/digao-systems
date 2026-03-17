package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port                 int
	StreamSocketPath     string
	FrameRate            int
	StreamProvider       string
	AuthMode             string
	AuthDefaultUser      string
	OIDCIssuerURL        string
	OIDCClientID         string
	ProxyUserHeader      string
	ProxyEmailHeader     string
	MaxSessions          int
	LaunchMode           string
	SessionShell         string
	LaunchPrefix         string
	SessionAutoEndOnExit bool
	GameCatalogFile      string
	GameCatalog          string
}

func FromEnv() Config {
	return Config{
		Port:                 getInt("PORT", 8080),
		StreamSocketPath:     getString("STREAM_SOCKET_PATH", "/tmp/digao-cloud-gaming/stream.sock"),
		FrameRate:            getInt("FRAME_RATE", 60),
		StreamProvider:       getString("STREAM_PROVIDER", "webrtc"),
		AuthMode:             getString("AUTH_MODE", "none"),
		AuthDefaultUser:      getString("AUTH_DEFAULT_USER", "dev-user"),
		OIDCIssuerURL:        getString("OIDC_ISSUER_URL", ""),
		OIDCClientID:         getString("OIDC_CLIENT_ID", ""),
		ProxyUserHeader:      getString("AUTH_PROXY_USER_HEADER", "X-Forwarded-User"),
		ProxyEmailHeader:     getString("AUTH_PROXY_EMAIL_HEADER", "X-Forwarded-Email"),
		MaxSessions:          getInt("MAX_CONCURRENT_SESSIONS", 1),
		LaunchMode:           getString("LAUNCH_MODE", "noop"),
		SessionShell:         getString("SESSION_SHELL", "/bin/bash"),
		LaunchPrefix:         getString("GAME_LAUNCH_PREFIX", ""),
		SessionAutoEndOnExit: getBool("SESSION_AUTO_END_ON_PROCESS_EXIT", true),
		GameCatalogFile:      getString("GAME_CATALOG_FILE", ""),
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

func getBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}

	return parsed
}
