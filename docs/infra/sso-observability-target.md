# SSO And Observability Target

## Goal

Use one central identity plane for all exposed services and one shared observability plane for the single host.

## Reverse proxy topology

- Keep `npm-prod` isolated for production traffic.
- Replace `npm-dev` + `npm-homolog` with one shared non-prod proxy.

This gives two proxies total:

- `npm-nonprod`
- `npm-prod`

## Authentication model

### What should use Keycloak SSO

- Digao OAuth Portal
- Prometheus
- Grafana
- Portainer
- future internal admin tools

### What should not depend on proxy-loop SSO

- NPM admin itself should stay restricted to Tailscale/private access.
- Do not make NPM depend on its own reverse-proxy chain for login.

That avoids circular auth and keeps break-glass access available.

## Recommended SSO component

Use `oauth2-proxy` in front of internal web UIs.

For the current `dev` rollout, prefer one small `oauth2-proxy` per admin UI and one shared OIDC client per environment. That keeps the NPM configuration simple: each proxy host points directly at its dedicated `oauth2-proxy` container.

Flow:

1. Browser hits service domain
2. Nginx checks auth with `oauth2-proxy`
3. `oauth2-proxy` redirects to Keycloak
4. Keycloak authenticates the user
5. `oauth2-proxy` returns headers/cookie to the upstream

## Why `oauth2-proxy`

- works well with Keycloak OIDC
- simple for Prometheus, Grafana, Portainer and other HTTP apps
- lets you centralize login without rewriting every service
- keeps NPM host configuration simple when each UI gets its own small proxy

## Java services

### Current state

- `auth-service` and `notification-service` already use Spring Boot
- they did not expose metrics or tracing endpoints yet

### Added now

- Actuator
- Prometheus metrics registry
- Micrometer tracing bridge for OpenTelemetry
- OTLP exporter config via env

Endpoints to use after deploy:

- `/actuator/health`
- `/actuator/prometheus`

## Observability stack target

### Metrics

- Prometheus
- node-exporter
- cAdvisor
- Spring Actuator `/actuator/prometheus`

### Dashboards

- Grafana

### Tracing

- OpenTelemetry Collector
- Tempo

### Optional logs later

- Loki + Promtail

## Minimal next rollout

1. Deploy `host-exporters`.
2. Keep one shared Prometheus.
3. Add Grafana.
4. Add OTel Collector + Tempo.
5. Put Prometheus/Grafana/Portainer behind `oauth2-proxy` + Keycloak.
6. Keep NPM admin behind Tailscale only.

## Important constraint

HTTP apps can share SSO quickly.
Non-HTTP infra services should not be forced through browser SSO.

Use Keycloak as the master identity for:

- people
- admin UIs
- internal dashboards

Do not try to make every protocol behave like a browser app.
