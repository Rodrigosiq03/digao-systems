# Monitoring And Edge

## Current state

- `dev`, `homolog` and `prod` each run their own `nginx-proxy-manager`.
- `prometheus-dev` and `prometheus-homolog` are running, but the current config only scrapes Prometheus itself.
- The server is a single host, so host-level pressure matters more than per-environment isolation for observability.

## Recommended edge layout

### Keep isolated

- `prod` reverse proxy stays isolated.
- `prod` certificates and proxy-host configuration stay isolated.

### Consolidate

- `dev` and `homolog` should share one reverse proxy instance.
- Keep separation at the hostname, upstream port, and Docker network level instead of one full NPM per environment.

This reduces:

- one full MariaDB/SQLite-backed NPM runtime
- one admin UI
- one TLS automation process
- idle RAM and periodic CPU usage

## Recommended monitoring layout

Use one shared host observability stack:

- `prometheus-prod` or a dedicated shared Prometheus
- `node-exporter` for host CPU, memory, load, filesystem and pressure
- `cadvisor` for container CPU, RAM, network and restart visibility

Do not keep one Prometheus per environment unless each environment truly lives on a different machine.

## Why this is the right split

- reverse proxy state is control-plane data, so `prod` deserves isolation
- `dev` and `homolog` are non-production and can share the same proxy process
- monitoring is infrastructure-wide, not environment-wide, on a single host

## Immediate rollout

1. Deploy `pulumi/host-exporters` on `prod`.
2. Point a single Prometheus config at `node-exporter-prod:9100` and `cadvisor-prod:8080`.
3. Stop `prometheus-dev` and `prometheus-homolog`.
4. Keep `npm-prod`.
5. Merge `npm-dev` and `npm-homolog` into one non-prod NPM.

## What to watch while gaming

- host CPU utilization
- host memory and swap usage
- container CPU spikes
- `keycloak`, `rabbitmq`, `notification`, `auth` restarts
- Sunshine plus Steam/Proton/Gamescope CPU demand

## Practical rule

If the host is under sustained pressure while gaming, first remove duplicated control-plane services.
On this host, duplicated reverse proxies and duplicated Prometheus instances are lower-value than keeping game streaming smooth.
