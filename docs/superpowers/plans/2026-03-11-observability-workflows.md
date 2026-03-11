# Observability Workflows Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CI/CD workflows for Grafana and Portainer so both stacks can be deployed through GitHub Actions in dev, homolog, and later prod.

**Architecture:** Reuse the established Pulumi workflow pattern from Prometheus. Keep stack selection behavior identical, add Grafana secret application because its Pulumi program requires an admin password, and keep Portainer simpler because it has no current secret injection requirement.

**Tech Stack:** GitHub Actions, Pulumi, Python virtualenv, repository-local secret application helper.

---

## Chunk 1: Add workflow files

### Task 1: Create Grafana workflow

**Files:**
- Create: `.github/workflows/pulumi-grafana.yml`
- Reference: `.github/workflows/pulumi-prometheus.yml`
- Reference: `pulumi/scripts/apply-secrets.py`

- [ ] Write the workflow using the Prometheus pattern.
- [ ] Add path triggers for `pulumi/grafana/**` and `.github/workflows/pulumi-grafana.yml`.
- [ ] Keep `workflow_dispatch` stack input.
- [ ] Add `Apply secrets` using `--project grafana`.
- [ ] Select or initialize the target stack and run `pulumi up --yes`.

### Task 2: Create Portainer workflow

**Files:**
- Create: `.github/workflows/pulumi-portainer.yml`
- Reference: `.github/workflows/pulumi-prometheus.yml`
- Reference: `pulumi/portainer/__main__.py`

- [ ] Write the workflow using the Prometheus pattern.
- [ ] Add path triggers for `pulumi/portainer/**` and `.github/workflows/pulumi-portainer.yml`.
- [ ] Keep `workflow_dispatch` stack input.
- [ ] Omit `Apply secrets` because the current Portainer Pulumi program has no secret requirements.
- [ ] Select or initialize the target stack and run `pulumi up --yes`.

## Chunk 2: Verify and prepare integration

### Task 3: Validate workflow syntax

**Files:**
- Verify: `.github/workflows/pulumi-grafana.yml`
- Verify: `.github/workflows/pulumi-portainer.yml`

- [ ] Parse both workflow files as YAML.
- [ ] Review the diff against the Prometheus workflow pattern.
- [ ] Confirm working directories, venv paths, stack mapping, and trigger paths.

### Task 4: Commit and publish

**Files:**
- Commit: new workflow files and docs

- [ ] Check git diff.
- [ ] Commit with a focused message.
- [ ] Push the branch for manual merge.
