# CI Performance And Governance Design

## Goal
Reduce runtime of the most expensive/frequent pipelines by treating the self-hosted runner as a persistent warm environment, then add lightweight dependency/version governance to control upgrades deliberately.

## Scope
Phase 1 targets only these workflows:
- `pulumi-services`
- `pulumi-keycloak`
- `pulumi-grafana`
- `pulumi-prometheus`

Phase 2 covers governance for:
- Python dependencies used by Pulumi projects
- Maven dependency/plugin discipline for Spring services
- floating Docker image tags that affect reproducibility
- lightweight runner toolchain checks

Out of scope in this iteration:
- full immutable CI environment
- runner reprovisioning automation
- pinning every runner package to an immutable version
- optimizing unrelated workflows

## Problem Statement
Current pipelines waste time on repeated bootstrap work:
- venvs are deleted and recreated every run
- Python dependencies are force reinstalled with no cache reuse
- Maven builds rely on a persistent repo but still pay avoidable bootstrap cost elsewhere
- obsolete runs continue even when a newer commit supersedes them

This causes unnecessary wall-clock time and runner contention.

## Requirements
### Performance
- Pipelines should reuse persistent runner state safely.
- Installation should be incremental when dependency inputs did not change.
- Old runs on the same workflow/ref should be cancelled automatically.
- The simple Pulumi workflows should trend toward sub-minute completion.

### Safety
- Persistent state must be validated before reuse.
- Workflows must be able to self-heal if a venv becomes invalid.
- Changes must not silently alter deploy semantics.

### Governance
- Dependency versions must be understandable and reviewable.
- Upgrades should happen intentionally, not because of floating resolution.
- Runner toolchain checks should detect obvious drift without overengineering immutability.

## Recommended Approach
Use persistent warm environments on the self-hosted runner with lightweight bootstrap validation.

### Workflow runtime model
Each targeted workflow will:
1. use a fixed venv path under `/data/apps/.venvs/<workflow>`
2. create the venv only if missing or invalid
3. install dependencies incrementally from `requirements.txt`
4. reuse `/data/apps/.m2` for Maven-backed workflows
5. use GitHub Actions `concurrency` keyed by workflow and ref
6. emit timing information around slow steps

### Why this approach
- fastest path to lower runtime on the current architecture
- minimal behavior change to the existing deploy flow
- easy to reason about and verify
- compatible with your desire for a runner that stays warm and current

## Alternatives Considered
### 1. Persistent runner optimization
Recommended.
Pros:
- immediate time savings
- minimal architectural change
- low operational cost
Cons:
- depends on runner hygiene
- some risk of hidden drift if validation is too weak

### 2. Build a generic caching/bootstrap framework first
Not recommended now.
Pros:
- cleaner abstraction long term
Cons:
- delays payoff
- more moving parts than needed for four workflows

### 3. Immutable CI environment first
Not recommended now.
Pros:
- strongest reproducibility
Cons:
- highest implementation cost
- slowest path to performance improvement
- misaligned with current self-hosted runner model

## Detailed Design
### Persistent Python environments
For each targeted Pulumi workflow:
- venv path remains stable between runs
- workflow checks for a working interpreter inside the venv
- if invalid, recreate the venv
- otherwise reuse it
- `pip install -r requirements.txt` runs without `--force-reinstall` and without `--no-cache-dir`

This lets pip only install changed or missing packages.

### Maven reuse in `pulumi-services`
Keep using the persistent local repo under `/data/apps/.m2`.
Do not clear it between runs.
Keep the wrapper-driven build, but avoid adding any cleanup that defeats reuse.

### Concurrency control
Each targeted workflow gets:
```yaml
concurrency:
  group: <workflow-name>-${{ github.ref }}
  cancel-in-progress: true
```

Effect:
- only the newest run per workflow/ref survives
- stale runs on `develop` or `main` are cancelled
- different workflows remain independent

### Timing visibility
Add simple timing around these steps:
- dependency/bootstrap
- build jar (`pulumi-services`)
- `pulumi up`

This is not full observability; it is enough to understand where the remaining time goes after warm-cache optimization.

## Governance Design
### Python
- keep requirements explicit and reviewed
- avoid reinstall churn as the first step
- after performance work, review for overly loose pins/ranges

### Java/Maven
- keep using Maven Wrapper
- review plugin/dependency explicitness later in phase 2
- do not broaden the scope during performance work

### Docker image tags
- identify floating tags such as `latest`
- convert them to explicit versions in the governance phase

### Runner toolchain
Do not fully lock runner toolchain versions yet.
Instead:
- verify expected Python path exists
- keep using declared tool entrypoints
- document installed expectations

This gives governance without turning the runner into a fragile snowflake.

## Migration Strategy
1. update the four target workflows only
2. verify YAML integrity
3. measure resulting runtime reduction from recent run history
4. then start the version-governance phase

## Success Criteria
- targeted workflows no longer delete/recreate venvs every run
- targeted workflows no longer force reinstall Python dependencies every run
- concurrency is active on all four target workflows
- workflows remain functionally equivalent for deploy behavior
- runtime of repeated runs is materially reduced, with the simple Pulumi workflows approaching one minute or less
