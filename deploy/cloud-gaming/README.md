# Deploy - Cloud Gaming

Subida do `dev v1` do cloud gaming com:

- backend Go em **host mode**
- launchers reais controlados pelo hub
- client React dedicado
- `oauth2-proxy` na frente do client
- publicacao no `npm-nonprod`

## Features do dev v1 deployado

- Client React com catalogo de jogos.
- Criacao/parada de sessao por usuario.
- Limite de sessoes concorrentes (`MAX_CONCURRENT_SESSIONS`).
- Provider de stream marcado como `sunshine`.
- Auth no perimetro via `oauth2-proxy + Keycloak`.
- Backend em `AUTH_MODE=proxy` para confiar apenas nos headers encaminhados pelo proxy.
- Launcher configuravel:
  - `LAUNCH_MODE=noop` para validar hub/limites/stream sem abrir Steam.
  - `LAUNCH_MODE=exec` para executar comando do jogo.

O deploy automatico do CI/CD sobe:
- backend host-mode via `systemd --user`
- `cloud-gaming-web`
- `oauth2-proxy-cloud-gaming`
- `STREAM_PROVIDER=sunshine`
- `LAUNCH_MODE=exec`
- `SESSION_AUTO_END_ON_PROCESS_EXIT=false`
- catalogo file-backed via `host/catalog.dev-v1.json`

Isso valida:
- URL oficial do produto
- auth obrigatoria do Keycloak
- contrato de sessao/catalogo
- fluxo de CI/CD em `develop`

Isso valida:
- launcher real do host para jogos aprovados no catalogo
- o fluxo `hub -> iniciar sessao -> jogo sobe no host -> Sunshine fica pronto`

Isso ainda nao valida:
- browser play
- Ryujinx
- catalogo automatico

## Subir

```bash
cd deploy/cloud-gaming
docker compose up -d --build digao-cloud-gaming-web oauth2-proxy-cloud-gaming
systemctl --user restart cloud-gaming-backend.service
```

## Acesso oficial

No `dev`, a entrada oficial esperada eh:

- `https://cloud-dev.rodrigodsiqueira.dev.br:8443`

Essa URL deve apontar no `npm-nonprod` para:

- host: `oauth2-proxy-cloud-gaming-dev`
- port: `4180`
- scheme: `http`

Flags recomendadas no NPM:

- `Block Common Exploits`: `ON`
- `Websockets Support`: `OFF`
- `Cache Assets`: `OFF`
- `HTTP/2 Support`: `ON`

Observacoes:

- o backend cru em `:8090` deixa de ser a entrada principal
- sem sessao do Keycloak, o acesso oficial nao deve abrir o produto
- o client React fala com a API pelo mesmo dominio, via Nginx interno do `cloud-gaming-web`
- o backend Go oficial roda no host, nao mais em container

## Acesso tecnico

- backend health: `http://SEU_HOST:8090/healthz`
- backend cru: `http://SEU_HOST:8090` (nao oficial)

## Parar

```bash
cd deploy/cloud-gaming
docker compose down
```

## Logs

```bash
cd deploy/cloud-gaming
docker compose logs -f digao-cloud-gaming-backend
docker compose logs -f digao-cloud-gaming-web
docker compose logs -f oauth2-proxy-cloud-gaming
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
- O script `host/prepare_proxy_auth.py` gera `oauth2-proxy.env` localmente no deploy e adiciona o redirect URI do cloud gaming ao client compartilhado `admin-ui-dev`.
- Para abrir Steam/RPCS3 real no host, o proximo passo eh trocar do baseline `noop` para launchers reais com Sunshine externo.
