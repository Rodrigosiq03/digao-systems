# Deploy - Cloud Gaming

Subida conjunta do backend Go (hub + WebRTC) e motor C++.

## Features do MVP dev

- Hub web com catalogo de jogos.
- Criacao/parada de sessao por usuario.
- Limite de sessoes concorrentes (`MAX_CONCURRENT_SESSIONS`).
- Stream WebRTC so abre com sessao ativa.
- Auth configuravel:
  - `AUTH_MODE=none` para bootstrap rapido em dev.
  - `AUTH_MODE=oidc` para validar JWT do Keycloak dev.
- Launcher configuravel:
  - `LAUNCH_MODE=noop` para validar hub/limites/stream sem abrir Steam.
  - `LAUNCH_MODE=exec` para executar comando do jogo.

## Subir

```bash
cd deploy/cloud-gaming
docker compose up -d --build
```

## Acesso

- Hub: `http://SEU_HOST:8090`
- Health: `http://SEU_HOST:8090/healthz`

## Parar

```bash
cd deploy/cloud-gaming
docker compose down
```

## Logs

```bash
cd deploy/cloud-gaming
docker compose logs -f digao-cloud-gaming-backend digao-cloud-gaming-motor
```

## Catalogo de jogos

A variavel `GAME_CATALOG` no compose usa formato:

`id::nome::descricao::comando;id2::nome2::descricao2::comando2`

Exemplo atual:

- `steam-cs2` -> `steam -applaunch 730`
- `steam-dota2` -> `steam -applaunch 570`

Troque os comandos conforme os jogos instalados no seu servidor.

Observacao importante:

- Em docker, o default esta `LAUNCH_MODE=noop` para validar fluxo.
- Para abrir Steam real no host, use `LAUNCH_MODE=exec` em processo com acesso ao ambiente grafico do host.
