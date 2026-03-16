# Digao Cloud Gaming (Go)

Hub web de cloud gaming com auth, catalogo e sessao. O backend ainda suporta o caminho WebRTC legado, mas o dev v1 usa `Sunshine` como provider de stream e mantem o navegador apenas como hub de controle.

## Estrutura

- `cmd/server`: ponto de entrada
- `internal/app`: bootstrap e ciclo de vida
- `internal/config`: configuracao por variaveis de ambiente
- `internal/httpserver`: rotas HTTP (`/`, `/ws`, `/healthz`)
- `internal/webrtc`: peer WebRTC do servidor
- `internal/stream`: broker de frames e receiver IPC (Unix socket)
- `internal/input`: recebimento de input (data channel e fallback por websocket)
- `internal/auth`: autenticacao (`none`, `oidc` ou `proxy`)
- `internal/hub`: catalogo de jogos e gerenciamento de sessoes
- `web/static`: frontend HTML/JS minimo (fallback tecnico)

## Variaveis de ambiente

- `PORT` (default `8080`)
- `FRAME_RATE` (default `60`)
- `STREAM_SOCKET_PATH` (default `/tmp/digao-cloud-gaming/stream.sock`)
- `STREAM_PROVIDER` (`webrtc` ou `sunshine`, default `webrtc`)
- `MAX_CONCURRENT_SESSIONS` (default `1`)
- `LAUNCH_MODE` (`noop` ou `exec`, default `noop`)
  - `noop`: cria sessao sem executar comando (ideal para docker dev)
  - `exec`: executa comando do jogo no host/processo
- `SESSION_SHELL` (default `/bin/bash`)
- `GAME_CATALOG_FILE` (opcional; arquivo JSON de catalogo manual)
- `GAME_CATALOG`
  - formato legado: `id::nome::descricao::comando::stop(opcional);...`
  - default: `steam-cs2` e `steam-dota2`
- `AUTH_MODE` (`none`, `oidc` ou `proxy`, default `none`)
- `AUTH_DEFAULT_USER` (default `dev-user`, usado no modo `none`)
- `OIDC_ISSUER_URL` (obrigatorio quando `AUTH_MODE=oidc`)
- `OIDC_CLIENT_ID` (opcional; quando vazio usa validacao de issuer/assinatura sem aud estrito)
- `AUTH_PROXY_USER_HEADER` (default `X-Forwarded-User`, usado no modo `proxy`)
- `AUTH_PROXY_EMAIL_HEADER` (default `X-Forwarded-Email`, usado no modo `proxy`)

## API principal

- `GET /api/hub`: usuario, jogos, limites e sessoes ativas
- `POST /api/sessions/start`: inicia sessao para um jogo (`{ "gameId": "steam-cs2" }`)
- `POST /api/sessions/stop`: encerra sessao do usuario
- `GET /api/sessions/me`: sessao ativa do usuario
- `GET /api/auth/me`: diagnostico de autenticacao
- `GET /ws`: WebRTC signaling (somente quando `STREAM_PROVIDER=webrtc`)

`GET /api/hub` tambem pode expor:

- `auth.mode`
- `stream.provider`
- `stream.browserPlayable`

## Modos de provider

### Sunshine (dev v1)

- o hub autentica, mostra catalogo e inicia/para a sessao
- o stream nao roda no navegador
- `/api/hub` expõe o provider ativo em `stream.provider`
- o botao antigo de `Conectar stream` deixa de fazer parte da UX principal
- no fluxo oficial, o acesso entra por `oauth2-proxy` e o backend opera em `AUTH_MODE=proxy`

### WebRTC legado

- mantido para compatibilidade e debug
- continua usando `/ws` + broker IPC + motor de stream

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
