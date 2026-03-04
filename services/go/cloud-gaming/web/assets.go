package web

import "embed"

// StaticFS embeds the lightweight browser client served by the Go binary.
//
//go:embed static/*
var StaticFS embed.FS
