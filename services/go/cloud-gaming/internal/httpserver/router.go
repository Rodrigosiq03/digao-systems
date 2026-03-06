package httpserver

import (
	"io/fs"
	"net/http"

	"github.com/digao/cloud-gaming/web"
)

type Handlers struct {
	SignalingWS  http.HandlerFunc
	Hub          http.HandlerFunc
	SessionStart http.HandlerFunc
	SessionStop  http.HandlerFunc
	SessionMe    http.HandlerFunc
	AuthMe       http.HandlerFunc
}

func NewRouter(h Handlers) http.Handler {
	staticSubFS, err := fs.Sub(web.StaticFS, "static")
	if err != nil {
		panic(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	if h.Hub != nil {
		mux.HandleFunc("/api/hub", h.Hub)
	}
	if h.SessionStart != nil {
		mux.HandleFunc("/api/sessions/start", h.SessionStart)
	}
	if h.SessionStop != nil {
		mux.HandleFunc("/api/sessions/stop", h.SessionStop)
	}
	if h.SessionMe != nil {
		mux.HandleFunc("/api/sessions/me", h.SessionMe)
	}
	if h.AuthMe != nil {
		mux.HandleFunc("/api/auth/me", h.AuthMe)
	}
	if h.SignalingWS != nil {
		mux.HandleFunc("/ws", h.SignalingWS)
	}
	mux.Handle("/", http.FileServer(http.FS(staticSubFS)))

	return mux
}
