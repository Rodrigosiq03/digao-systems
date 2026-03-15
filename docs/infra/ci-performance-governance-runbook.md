# CI Performance And Governance Runbook

## Scope
This runbook documents the performance model and governance baseline for:
- `pulumi-services`
- `pulumi-keycloak`
- `pulumi-grafana`
- `pulumi-prometheus`

## Performance Model
The self-hosted runner is intentionally persistent.

### Python environments
Each hot workflow keeps a dedicated virtualenv under `/data/apps/.venvs`:
- `/data/apps/.venvs/pulumi-services-auth-service`
- `/data/apps/.venvs/pulumi-services-notification-service`
- `/data/apps/.venvs/pulumi-keycloak`
- `/data/apps/.venvs/pulumi-grafana`
- `/data/apps/.venvs/pulumi-prometheus`

Behavior:
- if the venv exists and the interpreter works, reuse it
- if the venv is missing or broken, recreate it
- dependency installs are incremental
- a `.requirements.sha256` marker avoids reinstall when `requirements.txt` is unchanged

### Maven cache
`pulumi-services` uses `/data/apps/.m2` as a warm local Maven repository.
This directory is not cleared between runs.

### Concurrency
Each workflow uses `concurrency` keyed by workflow name and Git ref.
This cancels stale runs when a newer push supersedes them.

## Timing Markers
The workflows emit simple timing markers:
- `dependency_bootstrap_seconds`
- `maven_package_seconds`
- `pulumi_up_seconds`

Use these to detect whether remaining time is spent in:
- dependency bootstrap
- Java build
- Pulumi apply

## Operational Expectations
### Safe reuse
Persistent runner state is expected and intentional.
Do not add unconditional cleanup such as:
- deleting workflow venvs every run
- deleting `/data/apps/.m2`
- forcing pip reinstall when requirements did not change

### Self-healing
If a venv is corrupted, the workflow should rebuild it automatically.
If `.m2` becomes unhealthy, handle that as an explicit operational cleanup, not default workflow behavior.

## Governance Baseline
This phase does not fully lock the runner toolchain.
It does establish the policy for what gets governed next.

### Govern next
1. Python requirements review and pin discipline
2. Maven dependency/plugin explicitness review
3. Floating Docker image tags such as `latest`
4. Optional stronger pinning of GitHub Actions references

### Not in this phase
- immutable runner image
- full package pinning for all host tools
- automatic runner reprovisioning

## Upgrade Discipline
### Python
Changes to `requirements.txt` should be intentional and reviewed.
The workflow will install only what changed or is missing.

### Java
Keep using Maven Wrapper.
Dependency or plugin updates should be explicit in the repo, not inferred from runner state.

### Runner tools
Treat runner tools as governed infrastructure, but not yet fully pinned.
Any manual upgrade to Python, Pulumi, Java, Docker, or `gh` should be recorded.

## When To Clean Runner State
Only clean runner state when there is evidence of corruption or drift.
Examples:
- venv interpreter broken
- pip metadata inconsistent
- Maven repo corrupted

Recommended targeted actions:
- remove one affected venv only
- clean one affected artifact tree in `.m2`, not the whole cache unless necessary

## Success Signals
- repeated runs avoid bootstrap churn
- the simple Pulumi workflows move toward sub-minute completion
- stale runs do not consume the runner
- dependency upgrades remain deliberate and reviewable
