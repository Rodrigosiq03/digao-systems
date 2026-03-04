package httpserver

import (
	"io/fs"
	"net/http"

	"github.com/digao/cloud-gaming/web"
)

func NewRouter(signalingHandler http.HandlerFunc) http.Handler {
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
	mux.HandleFunc("/ws", signalingHandler)
	mux.Handle("/", http.FileServer(http.FS(staticSubFS)))

	return mux
}
