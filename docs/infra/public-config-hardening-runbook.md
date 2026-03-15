# Public Config Hardening Runbook

## Goal

Keep the public repository limited to code and safe defaults.

Tracked config should not expose live environment topology or runtime stack state when it is not necessary for CI/CD.

## Target state

Tracked in Git:

- `Pulumi.yaml`
- Python entrypoints (`__main__.py`)
- workflow definitions
- documentation

Not tracked in Git:

- `Pulumi.dev.yaml`
- `Pulumi.homolog.yaml`
- `Pulumi.prod.yaml`

Those files are treated as runtime-generated stack config, not source-of-truth source files.

## Current strategy

1. Move predictable non-sensitive defaults into Pulumi code.
2. Keep only real secrets injected at deploy time.
3. Generate stack config locally/CI as needed instead of tracking it.
4. Ignore runtime-generated stack files in Git.

## Implemented safeguards

`.gitignore` now ignores:

```text
pulumi/**/Pulumi.dev.yaml
pulumi/**/Pulumi.homolog.yaml
pulumi/**/Pulumi.prod.yaml
```

while preserving tracked project definitions:

```text
!pulumi/**/Pulumi.yaml
!pulumi/**/Pulumi.stack.template.yaml
```

## Secrets model

- local operations: `pulumi/.secrets.local`
- CI shared secrets: GitHub repository secrets
- CI stage-specific secrets: GitHub environment secrets

This keeps fallback/admin credentials outside the public repository.

## Code defaults moved out of stack YAML

The following projects now derive public defaults from the selected stack in code:

- `keycloak`
- `grafana`
- `prometheus`
- `nginx-proxy-manager`
- `auth-service`
- `notification-service`
- `digao-oauth-portal`
- `oauth2-proxy`
- `rabbitmq`
- `redis`
- `portainer`
- `host-exporters`

Examples of stack-derived defaults include:

- Docker network names by stage
- public ports by stage
- well-known public hostnames where needed
- local relative paths resolved from the project directory

## Validation steps

After changes to this model:

```bash
git status --short
git diff --check
python3 -m py_compile pulumi/*/__main__.py
```

Also validate representative stacks with preview after regenerating secrets/config locally.

## Operational rule

If a change requires a new non-secret per-stage value, prefer adding a code default derived from stack before introducing a tracked live stack YAML again.

If a change requires a secret, keep it in:

- `.secrets.local` for local use
- GitHub Secrets / Environment Secrets for CI
