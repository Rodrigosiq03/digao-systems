# CI Performance And Governance Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the four highest-priority CI workflows for a persistent warm self-hosted runner, then establish lightweight dependency/version governance foundations.

**Architecture:** Reuse workflow-specific Python virtualenvs and persistent Maven cache on the runner, remove destructive reinstall patterns, add concurrency cancellation, and add minimal validation/timing instrumentation. Governance work remains intentionally light in this phase: document and prepare the surfaces that need locks without overhauling unrelated tooling.

**Tech Stack:** GitHub Actions, shell, Python virtualenv, pip, Maven Wrapper, Pulumi

---

## File Map

### Workflows to modify
- Modify: `.github/workflows/pulumi-services.yml`
- Modify: `.github/workflows/pulumi-keycloak.yml`
- Modify: `.github/workflows/pulumi-grafana.yml`
- Modify: `.github/workflows/pulumi-prometheus.yml`

### Docs
- Create: `docs/infra/ci-performance-governance-runbook.md`

### Verification targets
- Inspect: recent workflow durations via `gh run list`
- Verify YAML syntax for modified workflows

## Chunk 1: Performance Optimization

### Task 1: Add concurrency to targeted workflows

**Files:**
- Modify: `.github/workflows/pulumi-services.yml`
- Modify: `.github/workflows/pulumi-keycloak.yml`
- Modify: `.github/workflows/pulumi-grafana.yml`
- Modify: `.github/workflows/pulumi-prometheus.yml`

- [ ] **Step 1: Add workflow-level concurrency blocks**

Use workflow-specific groups keyed by `github.ref` and `cancel-in-progress: true`.

- [ ] **Step 2: Verify concurrency appears in all four files**

Run:
```bash
rg -n '^concurrency:|cancel-in-progress|group:' .github/workflows/pulumi-{services,keycloak,grafana,prometheus}.yml
```
Expected: all four workflows contain concurrency settings

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/pulumi-services.yml .github/workflows/pulumi-keycloak.yml .github/workflows/pulumi-grafana.yml .github/workflows/pulumi-prometheus.yml
git commit -m "feat(ci): cancel stale runs on hot workflows"
```

### Task 2: Stop destroying Python venvs on every run

**Files:**
- Modify: `.github/workflows/pulumi-keycloak.yml`
- Modify: `.github/workflows/pulumi-grafana.yml`
- Modify: `.github/workflows/pulumi-prometheus.yml`
- Modify: `.github/workflows/pulumi-services.yml`

- [ ] **Step 1: Replace destructive venv bootstrap with validate-or-create logic**

Each workflow should:
- keep a fixed venv path
- test the interpreter inside the venv
- recreate only if missing/broken

- [ ] **Step 2: Verify there are no `rm -rf /data/apps/.venvs/...` lines left in the four workflows**

Run:
```bash
rg -n 'rm -rf /data/apps/.venvs' .github/workflows/pulumi-{services,keycloak,grafana,prometheus}.yml
```
Expected: no matches

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/pulumi-services.yml .github/workflows/pulumi-keycloak.yml .github/workflows/pulumi-grafana.yml .github/workflows/pulumi-prometheus.yml
git commit -m "perf(ci): reuse workflow virtualenvs"
```

### Task 3: Remove forced Python reinstalls

**Files:**
- Modify: `.github/workflows/pulumi-keycloak.yml`
- Modify: `.github/workflows/pulumi-grafana.yml`
- Modify: `.github/workflows/pulumi-prometheus.yml`
- Modify: `.github/workflows/pulumi-services.yml`

- [ ] **Step 1: Replace `pip install --no-cache-dir --force-reinstall` with incremental install**

Use normal `pip install -r requirements.txt` against the persistent venv.

- [ ] **Step 2: Keep `pip install --upgrade pip` only if necessary, otherwise minimize bootstrap churn**

Prefer stable bootstrap over always-upgrading pip unless the workflow truly depends on it.

- [ ] **Step 3: Verify reinstall flags are gone**

Run:
```bash
rg -n -- '--force-reinstall|--no-cache-dir' .github/workflows/pulumi-{services,keycloak,grafana,prometheus}.yml
```
Expected: no matches

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/pulumi-services.yml .github/workflows/pulumi-keycloak.yml .github/workflows/pulumi-grafana.yml .github/workflows/pulumi-prometheus.yml
git commit -m "perf(ci): make python dependency install incremental"
```

### Task 4: Add lightweight timing visibility to the slow steps

**Files:**
- Modify: `.github/workflows/pulumi-services.yml`
- Modify: `.github/workflows/pulumi-keycloak.yml`
- Modify: `.github/workflows/pulumi-grafana.yml`
- Modify: `.github/workflows/pulumi-prometheus.yml`

- [ ] **Step 1: Add timing output around bootstrap and deploy steps**

Keep it simple and shell-native.
Measure at least:
- dependency/bootstrap phase
- `pulumi up`
- `mvnw package` for `pulumi-services`

- [ ] **Step 2: Verify timing markers are present**

Run:
```bash
rg -n 'date \+%s|elapsed|duration|SECONDS' .github/workflows/pulumi-{services,keycloak,grafana,prometheus}.yml
```
Expected: timing instrumentation exists in all four workflows

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/pulumi-services.yml .github/workflows/pulumi-keycloak.yml .github/workflows/pulumi-grafana.yml .github/workflows/pulumi-prometheus.yml
git commit -m "chore(ci): add timing markers to hot workflows"
```

## Chunk 2: Governance Foundations

### Task 5: Document dependency and version governance scope

**Files:**
- Create: `docs/infra/ci-performance-governance-runbook.md`

- [ ] **Step 1: Document what is governed now vs later**

Cover:
- warm runner model
- venv persistence
- Maven cache expectations
- dependency lock/governance targets
- runner toolchain checks philosophy

- [ ] **Step 2: Document explicit next governance targets**

List:
- Python requirements review/pinning
- Maven dependency/plugin explicitness review
- floating Docker image tags
- optional later pinning of GitHub Actions by SHA

- [ ] **Step 3: Commit**

```bash
git add docs/infra/ci-performance-governance-runbook.md
git commit -m "docs(ci): add performance and governance runbook"
```

## Chunk 3: Verification

### Task 6: Validate workflow integrity

**Files:**
- Verify: modified workflow files

- [ ] **Step 1: Run `git diff --check`**

Run:
```bash
git diff --check
```
Expected: no output

- [ ] **Step 2: Parse the modified workflow YAML files**

Use a temporary Python env with `pyyaml` if needed.
Expected: all four modified workflows parse successfully as YAML.

- [ ] **Step 3: Verify target patterns are gone/present as expected**

Run:
```bash
rg -n 'rm -rf /data/apps/.venvs|--force-reinstall|--no-cache-dir' .github/workflows/pulumi-{services,keycloak,grafana,prometheus}.yml
```
Expected: no matches

Run:
```bash
rg -n '^concurrency:|cancel-in-progress|group:' .github/workflows/pulumi-{services,keycloak,grafana,prometheus}.yml
```
Expected: matches in all four files

- [ ] **Step 4: Compare recent run durations before/after once deployed**

Use `gh run list` as the measurement source.
This step may remain operational follow-up if no new run is triggered in-session.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(ci): optimize hot workflows on persistent runner"
```
