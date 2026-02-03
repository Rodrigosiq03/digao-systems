# Pulumi Infrastructure

This folder holds IaC for infrastructure services (queues, databases, caches, etc.).
Each service is its own Pulumi project for isolation and clean stack separation.

## Layout
- `pulumi/rabbitmq/`: RabbitMQ stack (single broker, multiple vhosts)
- `pulumi/keycloak/`: Keycloak stack (Postgres per environment)

## How to add a new service
1. Create a new folder under `pulumi/` (e.g. `pulumi/postgres`).
2. Add `Pulumi.yaml`, `requirements.txt`, `__main__.py`.
3. Create stack config files (dev/homolog/prod).

## State backend
You can use Pulumi Cloud or a local backend:
- Local backend example: `pulumi login file:///srv/pulumi-state`

## Local secrets
Secrets are stored in `pulumi/.secrets.local` (gitignored). Use the helper script to inject them into stacks:
```
pulumi/scripts/apply-secrets.py --project rabbitmq --stack dev --env dev --create
```

## GitHub Actions
The workflow uses a self-hosted runner and runs `pulumi up` on demand.
See `.github/workflows/pulumi-rabbitmq.yml`.
