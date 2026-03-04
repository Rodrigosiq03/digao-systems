# Obsidian Self-Hosted Vault (Hardened)

Stack para sincronizacao do Obsidian com CouchDB via subdominio, com acesso restrito ao Tailnet.

## Arquitetura

- `couchdb` roda apenas na rede interna Docker (`obsidian_net`).
- `nginx-proxy-manager` recebe 80/443 apenas no IP do Tailscale.
- sem port-forward no roteador.
- ACL do Tailscale controla quais dispositivos podem chegar no host.
- firewall local bloqueia 80/443 fora de `tailscale0`.

## Estrutura

```text
deploy/obsidian-vault
├── .env.example
├── docker-compose.yml
├── couchdb/local.ini
├── firewall/iptables-obsidian.sh
├── npm/advanced.conf
└── tailscale/policy.sample.json
```

## 1) Preparar variaveis e arquivos

```bash
cd deploy/obsidian-vault
cp .env.example .env
```

Edite `.env`:

- `DB_USER` e `DB_PASS` com senha forte.
- `TAILSCALE_IP` com o IPv4 do host (`tailscale ip -4`).
- `OBSIDIAN_DOMAIN` com seu subdominio (`notas.seudominio.com`).

Atualize o dominio em `couchdb/local.ini` na linha de `origins`.

## 2) Subir stack

```bash
cd deploy/obsidian-vault
docker compose up -d
docker compose ps
```

## 3) Configurar Nginx Proxy Manager

Abra painel admin:

```text
http://127.0.0.1:81
```

Crie Proxy Host:

- Domain Names: `notas.seudominio.com`
- Scheme: `http`
- Forward Hostname/IP: `couchdb`
- Forward Port: `5984`
- Websockets Support: `on`
- Block Common Exploits: `on`

Em `Advanced` cole o conteudo de `npm/advanced.conf`.

### Certificado TLS (recomendado)

Como o servico e tailnet-only, use DNS challenge:

- SSL Certificates -> Add SSL Certificate -> Let's Encrypt
- Use a DNS Challenge -> Cloudflare
- informe token com permissao `Zone.DNS Edit` + `Zone.Zone Read`
- ative `Force SSL`, `HTTP/2 Support`, `HSTS Enabled`

## 4) Tailscale ACL (privilegio minimo)

Use `tailscale/policy.sample.json` como base no painel Admin Console.

No servidor:

```bash
sudo tailscale set --advertise-tags=tag:obsidian-server
```

## 5) Firewall local (iptables)

Aplica regra para permitir 80/443 apenas via `tailscale0`:

```bash
cd deploy/obsidian-vault
sudo bash firewall/iptables-obsidian.sh
```

Persistencia (opcional):

```bash
sudo sh -c 'iptables-save > /etc/iptables/iptables.rules'
sudo systemctl enable --now iptables.service
```

## 6) DNS (Registro.br + Cloudflare)

1. Delegue o dominio no Registro.br para os nameservers Cloudflare.
2. No Cloudflare DNS:
   - tipo `A`
   - host `notas`
   - valor `TAILSCALE_IP` (`100.x.y.z`)
   - proxy `DNS only` (nuvem cinza)

Sem Tailnet, o host nao alcanca esse IP.

## 7) Configurar Obsidian

No plugin de sync/LiveSync:

- URL: `https://notas.seudominio.com`
- usuario/senha: `DB_USER` e `DB_PASS`
- database: conforme plugin (ex: `obsidian`)

## 8) Validacao rapida

No servidor:

```bash
docker compose -f deploy/obsidian-vault/docker-compose.yml logs -f couchdb npm
```

De um dispositivo fora do Tailnet, `https://notas.seudominio.com` deve falhar.
De um dispositivo autenticado no Tailnet, deve responder normalmente.
