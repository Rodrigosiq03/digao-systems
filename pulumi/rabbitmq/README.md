# RabbitMQ (Pulumi)

Single RabbitMQ broker with multiple vhosts (dev/homolog/prod), managed as code with Pulumi.

## Why this layout
- One broker is lighter for a single host.
- Vhosts isolate dev/homolog/prod while sharing resources.
- Pulumi gives Python-level logic and repeatable deploys.

## First-time setup (local)
```
cd /data/apps/pulumi/rabbitmq
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pulumi login file:///srv/pulumi-state
pulumi stack init prod
pulumi config set rabbitmq:adminUser admin
pulumi config set --secret rabbitmq:adminPassword '...'
pulumi config set --secret rabbitmq:erlangCookie '...'
pulumi config set --secret rabbitmq:devPassword '...'
pulumi config set --secret rabbitmq:homologPassword '...'
pulumi config set --secret rabbitmq:prodPassword '...'
pulumi up
```

## Stack configs
Non-secret config is stored in:
- `Pulumi.dev.yaml`
- `Pulumi.homolog.yaml`
- `Pulumi.prod.yaml`

## Notes
- If you run multiple stacks on the same host, change ports in the stack config.
- The container bootstraps `rabbitmq.conf` and `definitions.json` from env vars at startup.
