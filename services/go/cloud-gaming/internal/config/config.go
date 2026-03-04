package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port             int
	StreamSocketPath string
	FrameRate        int
}

func FromEnv() Config {
	return Config{
		Port:             getInt("PORT", 8080),
		StreamSocketPath: getString("STREAM_SOCKET_PATH", "/tmp/digao-cloud-gaming/stream.sock"),
		FrameRate:        getInt("FRAME_RATE", 60),
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
