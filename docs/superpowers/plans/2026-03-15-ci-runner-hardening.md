# CI Runner And Public Repo Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce total CI turnaround on the self-hosted host, modernize the runner runtime, remove public tracked live stack config for targeted surfaces, and complete a history/log audit with a concrete rewrite/no-rewrite decision.

**Architecture:** Split CI load across two labeled self-hosted runners on the same host, keep warm workflow state on both, route heavy and light jobs deliberately, and move public environment stack config to generated runtime files sourced from GitHub Secrets/Environments and local operational secrets. Complete the work with an evidence-driven audit of Git history and Actions logs.

**Tech Stack:** GitHub Actions, self-hosted GitHub runner, systemd, shell, Python virtualenv, Pulumi, Docker, Git history analysis, GitHub CLI

---

## File Map

### Host runner surface
- Inspect/Modify: `/data/actions-runner/.runner`
- Inspect/Modify: `/data/actions-runner/runsvc.sh`
- Inspect/Modify/Create: `/data/actions-runner-second/*` or equivalent second-runner directory
- Inspect/Modify: systemd unit files/services for both runners

### Workflow files
- Modify: `.github/workflows/pulumi-services.yml`
- Modify: `.github/workflows/pulumi-keycloak.yml`
- Modify: `.github/workflows/pulumi-grafana.yml`
- Modify: `.github/workflows/pulumi-prometheus.yml`
- Modify: `.github/workflows/pulumi-nginx-proxy-manager.yml`
- Modify: `.github/workflows/version-governance.yml`

### Pulumi/public-config hardening surface
- Modify or replace: targeted `pulumi/*/Pulumi.*.yaml` files that still expose live environment topology
- Create: stack config templates if needed
- Modify: `pulumi/scripts/apply-secrets.py`
- Create/Modify: helper scripts for rendering stack config in CI
- Modify: affected workflows to generate stack config at runtime

### Documentation
- Create: `docs/infra/ci-runner-host-runbook.md`
- Create: `docs/infra/public-config-hardening-runbook.md`
- Create: `docs/infra/history-audit-report.md`

### Verification targets
- Verify: GitHub Actions runner registration and labels
- Verify: workflow YAML parse
- Verify: recent run durations and overlap behavior
- Verify: git grep/history audit results

## Chunk 1: Runner Topology And Host Modernization

### Task 1: Inspect and document the current runner installation

**Files:**
- Inspect: `/data/actions-runner/.runner`
- Inspect: `/data/actions-runner/runsvc.sh`
- Create: `docs/infra/ci-runner-host-runbook.md`

- [ ] **Step 1: Capture the current runner configuration and service state**

Run commands to capture:
- configured labels / registration target
- runner version
- active service units
- active worker processes

- [ ] **Step 2: Record the current state in the host runbook**

Document:
- runner directory layout
- current service name(s)
- current runtime observations
- rollback notes

- [ ] **Step 3: Commit**

```bash
git add docs/infra/ci-runner-host-runbook.md
git commit -m "docs(ci): record current runner host state"
```

### Task 2: Create and register a second runner on the same host

**Files:**
- Create: second runner installation directory on host
- Modify: host service definitions as needed
- Modify: `docs/infra/ci-runner-host-runbook.md`

- [ ] **Step 1: Create a second runner installation from the current runner baseline**

Use a dedicated directory and separate service identity.

- [ ] **Step 2: Register the second runner with dedicated labels**

Target labels:
- `infra-light`
- `infra-heavy`

At minimum, ensure the two runners are distinguishable and routable.

- [ ] **Step 3: Start both runner services and verify GitHub sees them online**

Run:
```bash
gh api repos/Rodrigosiq03/digao-systems/actions/runners
```
Expected: two online runners with the intended labels

- [ ] **Step 4: Document service management and rollback**

Add exact restart/stop/status commands to the runbook.

- [ ] **Step 5: Commit**

```bash
git add docs/infra/ci-runner-host-runbook.md
git commit -m "chore(ci): add second self-hosted runner"
```

### Task 3: Move the runner environment to a Node 24-ready posture

**Files:**
- Modify: runner host configuration/scripts if needed
- Modify: `docs/infra/ci-runner-host-runbook.md`

- [ ] **Step 1: Inspect how the runner currently selects the JavaScript runtime**

Verify whether it is still pinned to Node 20 semantics.

- [ ] **Step 2: Update the host so JavaScript actions run in a Node 24-compatible posture**

Do not break the currently used actions.

- [ ] **Step 3: Verify basic action compatibility on the active workflows**

Check at least:
- `actions/checkout`
- `dorny/paths-filter`
- `trstringer/manual-approval`

- [ ] **Step 4: Document the final runner runtime posture and recovery steps**

- [ ] **Step 5: Commit**

```bash
git add docs/infra/ci-runner-host-runbook.md
git commit -m "chore(ci): document node24-ready runner posture"
```

## Chunk 2: Workflow Routing And Throughput

### Task 4: Route heavy and light workflows to explicit runner labels

**Files:**
- Modify: `.github/workflows/pulumi-services.yml`
- Modify: `.github/workflows/pulumi-keycloak.yml`
- Modify: `.github/workflows/pulumi-grafana.yml`
- Modify: `.github/workflows/pulumi-prometheus.yml`
- Modify: `.github/workflows/pulumi-nginx-proxy-manager.yml`
- Modify: `.github/workflows/version-governance.yml`

- [ ] **Step 1: Update `runs-on` for the heavy workflow**

`pulumi-services` should target the heavy runner label.

- [ ] **Step 2: Update `runs-on` for the light workflows**

The remaining listed workflows should target the light runner label.

- [ ] **Step 3: Verify all modified workflows still parse as YAML**

Run a parser check locally.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/pulumi-services.yml \
  .github/workflows/pulumi-keycloak.yml \
  .github/workflows/pulumi-grafana.yml \
  .github/workflows/pulumi-prometheus.yml \
  .github/workflows/pulumi-nginx-proxy-manager.yml \
  .github/workflows/version-governance.yml
git commit -m "feat(ci): route workflows across heavy and light runners"
```

### Task 5: Verify overlap behavior and total turnaround improvement

**Files:**
- Modify: `docs/infra/ci-runner-host-runbook.md`

- [ ] **Step 1: Trigger or observe a push that starts both heavy and light workflows**

- [ ] **Step 2: Capture evidence that light workflows no longer wait behind `pulumi-services`**

Use:
```bash
gh run list --limit 20 --json databaseId,workflowName,status,conclusion,createdAt,updatedAt
```
And inspect overlapping jobs.

- [ ] **Step 3: Record before/after behavior in the runbook**

- [ ] **Step 4: Commit**

```bash
git add docs/infra/ci-runner-host-runbook.md
git commit -m "docs(ci): record multi-runner throughput results"
```

## Chunk 3: Public Config Hardening

### Task 6: Map the live public stack-config exposure that remains in the repo

**Files:**
- Inspect: `pulumi/**/Pulumi*.yaml`
- Create: `docs/infra/public-config-hardening-runbook.md`

- [ ] **Step 1: Inventory currently tracked stack config files and classify them**

Classes:
- safe template/public default
- live topology/config internal
- secret-bearing ciphertext only

- [ ] **Step 2: Record the inventory and target state in the hardening runbook**

- [ ] **Step 3: Commit**

```bash
git add docs/infra/public-config-hardening-runbook.md
git commit -m "docs(security): inventory tracked pulumi stack configs"
```

### Task 7: Introduce generated stack config for targeted surfaces

**Files:**
- Modify: relevant targeted workflows
- Modify/Create: helper scripts under `pulumi/scripts/`
- Modify/Remove: targeted public `Pulumi.<stack>.yaml` files
- Create: minimal templates where needed

- [ ] **Step 1: Choose the first targeted surfaces to migrate in this iteration**

Prefer the already-active admin/infra surfaces first.

- [ ] **Step 2: Implement runtime stack-config rendering in CI from GitHub Secrets/Environment Secrets**

Use:
- repository secrets for shared sensitive values
- environment secrets for stage-specific sensitive values

- [ ] **Step 3: Ensure local manual operation still works with `.secrets.local`**

- [ ] **Step 4: Remove or sanitize the tracked live stack config files for the migrated surfaces**

- [ ] **Step 5: Verify workflows still deploy correctly after config generation**

- [ ] **Step 6: Commit**

```bash
git add pulumi/scripts/ .github/workflows/ docs/infra/public-config-hardening-runbook.md pulumi/
git commit -m "feat(security): generate stack config at runtime for targeted surfaces"
```

## Chunk 4: History And CI Audit

### Task 8: Audit current branch, reachable history, and workflow logs

**Files:**
- Create: `docs/infra/history-audit-report.md`

- [ ] **Step 1: Audit current tracked files for sensitive patterns**

Search for:
- plaintext passwords/tokens/secrets
- internal topology that should no longer be public
- stack config files that should have become templates

- [ ] **Step 2: Audit Git history for the same sensitive patterns and targeted paths**

Focus on:
- `Pulumi*.yaml`
- generated config files
- auth/admin surfaces
- prior stack-config commits

- [ ] **Step 3: Audit relevant GitHub Actions logs for leaked values**

Use `gh run view --log` on representative recent runs.

- [ ] **Step 4: Classify all findings and decide the remediation path**

Classify as:
- `secret real`
- `topology/config internal`
- `noise`

- [ ] **Step 5: Write the audit report with a concrete rewrite/no-rewrite recommendation**

- [ ] **Step 6: Commit**

```bash
git add docs/infra/history-audit-report.md
git commit -m "docs(security): add git history and actions audit report"
```

## Chunk 5: Final Verification

### Task 9: Verify the full end state before integration

**Files:**
- Verify: all touched files

- [ ] **Step 1: Run `git diff --check`**

Expected: no output

- [ ] **Step 2: Parse all modified workflow YAML files**

Expected: valid YAML

- [ ] **Step 3: Verify both runners are online and correctly labeled**

Expected: GitHub API shows both runners online with intended labels

- [ ] **Step 4: Verify targeted workflows complete successfully on the intended runners**

Use recent workflow/job metadata and logs.

- [ ] **Step 5: Verify the migrated surfaces no longer rely on tracked live stack files**

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(ci): harden runners and public config surfaces"
```
