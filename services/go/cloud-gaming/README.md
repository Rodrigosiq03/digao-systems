# Digao Cloud Gaming (Go)

Servidor de sinalizacao e streaming WebRTC, com cliente web embutido via `go:embed`.

## Estrutura

- `cmd/server`: ponto de entrada
- `internal/app`: bootstrap e ciclo de vida
- `internal/config`: configuracao por variaveis de ambiente
- `internal/httpserver`: rotas HTTP (`/`, `/ws`, `/healthz`)
- `internal/webrtc`: peer WebRTC do servidor
- `internal/stream`: broker de frames e receiver IPC (Unix socket)
- `internal/input`: recebimento de input (data channel e fallback por websocket)
- `web/static`: frontend HTML/JS minimo

## Variaveis de ambiente

- `PORT` (default `8080`)
- `FRAME_RATE` (default `60`)
- `STREAM_SOCKET_PATH` (default `/tmp/digao-cloud-gaming/stream.sock`)

## Rodando sem Docker

```bash
cd services/go/cloud-gaming
go mod tidy
go run ./cmd/server
```

## Rodando com motor C++ (compose integrado)

```bash
cd services/go/cloud-gaming
docker compose up -d --build
```

Acesse `http://localhost:8080`.
