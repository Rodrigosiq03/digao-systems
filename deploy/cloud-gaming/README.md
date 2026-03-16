# Deploy - Cloud Gaming

Subida basica do backend Go em modo `Sunshine + noop` para validar o hub dev v1.

## Features do dev v1 deployado

- Hub web com catalogo de jogos.
- Criacao/parada de sessao por usuario.
- Limite de sessoes concorrentes (`MAX_CONCURRENT_SESSIONS`).
- Provider de stream marcado como `sunshine`.
- Auth configuravel:
  - `AUTH_MODE=none` para bootstrap rapido em dev.
  - `AUTH_MODE=oidc` para validar JWT do Keycloak dev.
- Launcher configuravel:
  - `LAUNCH_MODE=noop` para validar hub/limites/stream sem abrir Steam.
  - `LAUNCH_MODE=exec` para executar comando do jogo.

O compose automatico do CI/CD usa o modo mais basico:
- backend apenas
- `STREAM_PROVIDER=sunshine`
- `LAUNCH_MODE=noop`
- catalogo file-backed via `host/catalog.dev-v1.json`

Isso valida:
- URL do hub
- auth basica do backend
- contrato de sessao/catalogo
- fluxo de CI/CD em `develop`

Isso ainda nao valida:
- launcher real no host
- Moonlight
- RPCS3/Steam abrindo via backend

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
docker compose logs -f digao-cloud-gaming-backend
```

## Notebook tampa fechada (host hardening)

Scripts de suporte em `deploy/cloud-gaming/host/`:

- `enable-lid-closed-mode.sh`: aplica config de logind/sleep + linger/ssh/tailscale.
- `preflight.sh`: valida prontidao de sessao grafica, monitor e backend.

Fluxo:

```bash
cd /data/apps/worktrees/cloud-gaming/deploy/cloud-gaming/host
sudo bash ./enable-lid-closed-mode.sh rodrigo
systemctl --user enable --now sunshine
./preflight.sh
```

## Catalogo de jogos
O compose usa `GAME_CATALOG_FILE=/app/config/catalog.dev-v1.json`, montado de:

- `deploy/cloud-gaming/host/catalog.dev-v1.json`

Catalogo inicial:

- `weed-shop-3`
- `schedule-i`
- `god-of-war-iii`

O item de Ryujinx fica desabilitado no arquivo e nao aparece no catalogo ativo.

Observacao importante:

- Em docker, o default do CI/CD esta `LAUNCH_MODE=noop` para validar fluxo.
- Para abrir Steam/RPCS3 real no host, o proximo passo eh migrar o deploy dev para backend host-mode com launchers reais e Sunshine externo.
