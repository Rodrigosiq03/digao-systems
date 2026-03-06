# Digao Cloud Gaming (Go)

Servidor de sinalizacao e streaming WebRTC com hub de jogos (MVP dev), com cliente web embutido via `go:embed`.

## Estrutura

- `cmd/server`: ponto de entrada
- `internal/app`: bootstrap e ciclo de vida
- `internal/config`: configuracao por variaveis de ambiente
- `internal/httpserver`: rotas HTTP (`/`, `/ws`, `/healthz`)
- `internal/webrtc`: peer WebRTC do servidor
- `internal/stream`: broker de frames e receiver IPC (Unix socket)
- `internal/input`: recebimento de input (data channel e fallback por websocket)
- `internal/auth`: autenticacao (`none` ou `oidc`)
- `internal/hub`: catalogo de jogos e gerenciamento de sessoes
- `web/static`: frontend HTML/JS minimo

## Variaveis de ambiente

- `PORT` (default `8080`)
- `FRAME_RATE` (default `60`)
- `STREAM_SOCKET_PATH` (default `/tmp/digao-cloud-gaming/stream.sock`)
- `MAX_CONCURRENT_SESSIONS` (default `1`)
- `LAUNCH_MODE` (`noop` ou `exec`, default `noop`)
  - `noop`: cria sessao sem executar comando (ideal para docker dev)
  - `exec`: executa comando do jogo no host/processo
- `SESSION_SHELL` (default `/bin/bash`)
- `GAME_CATALOG`
  - formato: `id::nome::descricao::comando;id2::nome2::descricao2::comando2`
  - default: `steam-cs2` e `steam-dota2`
- `AUTH_MODE` (`none` ou `oidc`, default `none`)
- `AUTH_DEFAULT_USER` (default `dev-user`, usado no modo `none`)
- `OIDC_ISSUER_URL` (obrigatorio quando `AUTH_MODE=oidc`)
- `OIDC_CLIENT_ID` (opcional; quando vazio usa validacao de issuer/assinatura sem aud estrito)

## API principal

- `GET /api/hub`: usuario, jogos, limites e sessoes ativas
- `POST /api/sessions/start`: inicia sessao para um jogo (`{ "gameId": "steam-cs2" }`)
- `POST /api/sessions/stop`: encerra sessao do usuario
- `GET /api/sessions/me`: sessao ativa do usuario
- `GET /api/auth/me`: diagnostico de autenticacao
- `GET /ws`: WebRTC signaling (requer sessao ativa)

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

Acesse `http://localhost:8090` (quando usando o compose desta pasta).
