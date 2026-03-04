# Projeto: Obsidian Self-Hosted Vault (Hardened)

## Objetivo

Permitir sincronizacao de vault Obsidian com CouchDB por subdominio HTTPS, com trafego restrito ao Tailnet (Tailscale) e sem exposicao publica de portas no roteador.

## Arquitetura

- CouchDB isolado em rede Docker interna.
- Nginx Proxy Manager como borda TLS/reverse proxy.
- DNS em Cloudflare apontando para IP `100.x` do Tailscale (DNS only).
- ACL Tailscale para privilegio minimo.
- Firewall local permitindo 80/443 somente por `tailscale0`.

## Principios de seguranca

- sem port-forward no roteador.
- sem exposicao direta da porta 5984.
- acesso apenas de dispositivos autenticados no Tailnet.
- TLS com certificado Let's Encrypt via DNS challenge.
- regras de proxy com allowlist de ranges Tailscale.

## Implementacao no monorepo

Tudo em `deploy/obsidian-vault`:

- `docker-compose.yml`
- `couchdb/local.ini`
- `tailscale/policy.sample.json`
- `firewall/iptables-obsidian.sh`
- `npm/advanced.conf`
- `README.md` com passo a passo operacional
