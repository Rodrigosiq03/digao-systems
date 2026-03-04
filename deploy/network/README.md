# Baseline de Rede (dev/homolog/prod)

Pacote para preparar a malha de rede por ambiente antes da promocao completa para producao.

## Conteudo

- `tailscale/policy.multi-env.sample.json`: ACL base com segregacao por ambiente.
- `firewall/iptables-multi-env.sh`: regras locais para aceitar portas dos ambientes apenas via `tailscale0`.
- `scripts/check-dev-stack.sh`: smoke test tecnico para verificar containers/portas de dev.
- `DEV_READINESS.md`: ordem de deploy e checklist para validar dev antes de homolog.

## Portas por ambiente (NPM)

- dev: `8080` (http), `8443` (https), `8181` (admin)
- homolog: `8083` (http), `8444` (https), `8182` (admin)
- prod: `80` (http), `443` (https), `81` (admin)

## Aplicacao das regras

```bash
cd deploy/network
sudo bash firewall/iptables-multi-env.sh
```

## Smoke test de dev

```bash
cd /data/apps
bash deploy/network/scripts/check-dev-stack.sh
```

## ACL no Tailscale

Use `tailscale/policy.multi-env.sample.json` como base no painel Admin Console.
Troque e-mails/grupos/tags para seus valores reais.
