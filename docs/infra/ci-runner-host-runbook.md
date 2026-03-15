# CI Runner Host Runbook

## Current topology

This host runs two self-hosted GitHub Actions runners for `Rodrigosiq03/digao-systems`:

- `cachyos-rodrigo`
  - labels: `self-hosted`, `Linux`, `X64`, `infra-light`
  - intended workloads: `pulumi-keycloak`, `pulumi-grafana`, `pulumi-prometheus`, `pulumi-nginx-proxy-manager`, `version-governance`
- `cachyos-rodrigo-heavy`
  - labels: `self-hosted`, `Linux`, `X64`, `infra-heavy`
  - intended workloads: `pulumi-services`

This split reduces end-to-end wait time when multiple workflows are triggered together.

## Installed runner paths

- existing runner: `/data/actions-runner`
- heavy runner: `/home/rodrigo/actions-runner-heavy`

## Services

### Existing runner

Current service name:

- `actions.runner.Rodrigosiq03-digao-systems.cachyos-rodrigo.service`

Note:
- its `runsvc.sh` was updated to prefer Node 24 on future restarts
- workflow-level `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` is also set, so workflows do not depend on an immediate service restart

### Heavy runner

User service:

- `actions.runner.Rodrigosiq03-digao-systems.cachyos-rodrigo-heavy.service`

Useful commands:

```bash
systemctl --user status actions.runner.Rodrigosiq03-digao-systems.cachyos-rodrigo-heavy.service
systemctl --user restart actions.runner.Rodrigosiq03-digao-systems.cachyos-rodrigo-heavy.service
journalctl --user -u actions.runner.Rodrigosiq03-digao-systems.cachyos-rodrigo-heavy.service -f
```

## Node runtime

The heavy runner is explicitly running Node 24 via its `runsvc.sh` process tree.

Validation:

```bash
systemctl --user status actions.runner.Rodrigosiq03-digao-systems.cachyos-rodrigo-heavy.service --no-pager
```

Expected evidence includes:

```text
./externals/node24/bin/node ./bin/RunnerService.js
```

## GitHub runner registration

List runners and labels:

```bash
gh api repos/Rodrigosiq03/digao-systems/actions/runners \
  --jq '.runners[] | {id,name,online,labels:[.labels[].name]}'
```

Expected labels:

- runner id `2`: `infra-light`
- runner id `22`: `infra-heavy`

## Workflow routing

Current routing policy:

- `pulumi-services`
  - `changes` job on `infra-light`
  - `deploy` job on `infra-heavy`
- `pulumi-keycloak`
  - `infra-light`
- `pulumi-grafana`
  - `infra-light`
- `pulumi-prometheus`
  - `infra-light`
- `pulumi-nginx-proxy-manager`
  - `infra-light`
- `version-governance`
  - `infra-light`

## Warm caches

Persistent caches live on the host and are intentionally reused:

- Python venvs: `/data/apps/.venvs/...`
- Maven local repo: standard persistent `.m2`

The workflows now:

- keep named venvs per workflow
- skip pip install when `requirements.txt` hash is unchanged
- avoid destructive reinstalls
- use `concurrency` to cancel obsolete runs on the same ref

## Operational notes

- If the light runner needs a full restart, it may require privileged access depending on how the system service is managed.
- The heavy runner is user-managed and can be restarted without touching system-level service units.
- If a workflow starts queueing unexpectedly while both runners are online, verify labels first, then inspect service health.
