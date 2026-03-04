# Digao Platform Monorepo

Monorepo com servicos Java, stack de infraestrutura (RabbitMQ/Pulumi), stack de cloud gaming (Go + C++) e stack de Obsidian self-hosted hardened.

## Estrutura principal

```text
.
├── clients/
│   └── web/
├── services/
│   ├── java/
│   │   ├── auth-service/
│   │   ├── notification-service/
│   │   └── keycloak-email-spi/
│   ├── go/
│   │   └── cloud-gaming/
│   └── cpp/
│       └── cloud-gaming-motor/
├── deploy/
│   ├── cloud-gaming/
│   └── obsidian-vault/
├── shared-kernel/
├── pulumi/
│   ├── rabbitmq/
│   ├── auth-service/
│   ├── notification-service/
│   ├── keycloak/
│   └── ...
├── documento_cloud_gaming.md
├── documento_cloud_gaming_tecnico.md
└── documento_obsidian_self_hosted_vault.md
```

## Build Java (agregador)

```bash
mvn -q -DskipTests validate
```

## Build Go (cloud-gaming backend)

```bash
cd services/go/cloud-gaming
go mod tidy
go test ./...
```

## Build C++ (cloud-gaming motor)

```bash
cd services/cpp/cloud-gaming-motor
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
ctest --test-dir build --output-on-failure
```

## Subida completa do sistema cloud-gaming

```bash
cd deploy/cloud-gaming
docker compose up -d --build
```

## Pipeline CI/CD

Workflow dedicado em `.github/workflows/cloud-gaming.yml` com:

- testes de Go
- build + testes do C++
- build das imagens docker dos dois servicos
- deploy automatico com `docker compose` em runner self-hosted

## Infra RabbitMQ (Pulumi)

Projeto em `pulumi/rabbitmq`, mantendo provisioning isolado da camada de aplicacao.

## Deploy Obsidian Vault (hardened)

Arquivos em `deploy/obsidian-vault`:

- `docker-compose.yml` com CouchDB isolado em rede interna e Nginx Proxy Manager na borda.
- `tailscale/policy.sample.json` com ACL de privilegio minimo.
- `firewall/iptables-obsidian.sh` para permitir 80/443 apenas via `tailscale0`.
- `npm/advanced.conf` com allowlist de Tailnet e bloqueio opcional por User-Agent.

Subida inicial:

```bash
cd deploy/obsidian-vault
cp .env.example .env
docker compose up -d
```
