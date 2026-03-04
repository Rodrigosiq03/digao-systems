# Obsidian Self-Hosted Vault (Hardened)

Stack de producao para Obsidian LiveSync usando **CouchDB** atras do **NPM de prod existente** (`npm-prod`).

Nao cria novo NPM.

## Arquitetura

- `obsidian-couchdb-prod` sem porta exposta no host.
- rede interna `obsidian_net` + anexo na rede externa `npm_prod`.
- `npm-prod` (stack central) faz reverse proxy/TLS para o CouchDB.
- acesso externo controlado por Tailscale ACL + firewall local.

## Estrutura

```text
deploy/obsidian-vault
├── .env.example
├── couchdb/local.ini
├── docker-compose.yml
├── firewall/iptables-obsidian.sh
├── npm/advanced.conf
├── scripts/
│   ├── bootstrap.sh
│   ├── up.sh
│   ├── healthcheck.sh
│   ├── backup.sh
│   ├── restore.sh
│   └── status.sh
└── systemd/
    ├── install-timers.sh
    ├── obsidian-vault-healthcheck.service
    ├── obsidian-vault-healthcheck.timer
    ├── obsidian-vault-backup.service
    └── obsidian-vault-backup.timer
```

## 1) Subir NPM de prod (stack central)

Se ainda nao estiver rodando:

```bash
PULUMI_CONFIG_PASSPHRASE='SUA_PASSPHRASE' \
pulumi -C /data/apps/pulumi/nginx-proxy-manager up --stack prod --yes
```

## 2) Preparar `.env`

```bash
cd /data/apps/deploy/obsidian-vault
cp -n .env.example .env
```

Preencha:

- `DB_USER`
- `DB_PASS` (forte)
- `OBSIDIAN_DOMAIN` (ex.: `notas.rodrigodsiqueira.dev.br`)
- `BACKUP_RETENTION_DAYS` (opcional)

Atualize `couchdb/local.ini` em `cors.origins` com seu dominio.

## 3) Subir CouchDB do Obsidian

```bash
cd /data/apps/deploy/obsidian-vault
./scripts/up.sh
./scripts/healthcheck.sh
```

## 4) Configurar Proxy Host no `npm-prod`

Painel admin do NPM prod: `http://SEU_HOST:81` (via Tailscale).

Proxy Host:

- Domain Names: `notas.seudominio.com`
- Scheme: `http`
- Forward Hostname/IP: `obsidian-couchdb-prod`
- Forward Port: `5984`
- Websockets Support: `on`
- Block Common Exploits: `on`

Em `Advanced`, cole `npm/advanced.conf`.

TLS:

- Let's Encrypt via DNS challenge (Cloudflare)
- Force SSL: `on`
- HTTP/2: `on`
- HSTS: `on`

## 5) Tailscale ACL + Firewall

ACL base:

- `tailscale/policy.sample.json`

No host:

```bash
sudo tailscale set --advertise-tags=tag:obsidian-server
```

Firewall local para 80/443 via `tailscale0`:

```bash
sudo bash /data/apps/deploy/obsidian-vault/firewall/iptables-obsidian.sh
```

## 6) Operacao (Day-2)

Status:

```bash
cd /data/apps/deploy/obsidian-vault
./scripts/status.sh
```

Healthcheck manual:

```bash
./scripts/healthcheck.sh
```

Backup manual:

```bash
./scripts/backup.sh
```

Restore:

```bash
./scripts/restore.sh /data/apps/deploy/obsidian-vault/runtime/prod/backups/obsidian-vault-YYYYMMDDTHHMMSSZ.tar.gz --yes
```

Timers automáticos (health 5min + backup diario):

```bash
sudo bash /data/apps/deploy/obsidian-vault/systemd/install-timers.sh
```

Logs dos timers:

```bash
journalctl -u obsidian-vault-healthcheck.service -u obsidian-vault-backup.service -f
```
