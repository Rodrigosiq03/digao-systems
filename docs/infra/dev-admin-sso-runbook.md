# Dev Admin SSO Runbook

## Goal

Protect the admin UIs in `dev` with Keycloak login through `oauth2-proxy` while keeping `npm` admin itself out of the hard dependency chain.

## Components

- `oauth2-proxy-grafana-dev` -> upstream `grafana-dev:3000`
- `oauth2-proxy-metrics-dev` -> upstream `prometheus-dev:9090`
- `oauth2-proxy-portainer-dev` -> upstream `portainer-shared:9000`
- shared Keycloak client: `admin-ui-dev`

## Required local secrets

Add these keys to `pulumi/.secrets.local`:

- `[dev] OAUTH2_PROXY_CLIENT_SECRET_DEV`
- `[dev] OAUTH2_PROXY_COOKIE_SECRET_DEV`

For later rollout:

- `[homolog] OAUTH2_PROXY_CLIENT_SECRET_HOMOLOG`
- `[homolog] OAUTH2_PROXY_COOKIE_SECRET_HOMOLOG`

## Deployment

Apply secrets:

```bash
python pulumi/scripts/apply-secrets.py --project oauth2-proxy --stack dev --env dev --create
```

Deploy:

```bash
pulumi -C pulumi/oauth2-proxy up --stack dev --yes
```

## NPM configuration

Replace each upstream target in NPM with the corresponding oauth2-proxy container:

### Grafana

- Domain: `grafana-dev.rodrigodsiqueira.dev.br`
- Scheme: `http`
- Forward Hostname / IP: `oauth2-proxy-grafana-dev`
- Forward Port: `4180`
- Websockets: `ON`

### Prometheus

- Domain: `metrics-dev.rodrigodsiqueira.dev.br`
- Scheme: `http`
- Forward Hostname / IP: `oauth2-proxy-metrics-dev`
- Forward Port: `4180`
- Websockets: `OFF`

### Portainer

- Domain: `portainer.rodrigodsiqueira.dev.br`
- Scheme: `http`
- Forward Hostname / IP: `oauth2-proxy-portainer-dev`
- Forward Port: `4180`
- Websockets: `ON`

## Validation

1. Open `grafana-dev` in the browser.
2. Confirm redirect to `kc-dev`.
3. Login with the master user in the `digao-oauth-dev` realm.
4. Confirm return to the original UI after callback.
5. Repeat for `metrics-dev` and `portainer`.

## Operational note

Keep `npm` admin itself on private/Tailscale fallback access even if you later add SSO for normal day-to-day access.
