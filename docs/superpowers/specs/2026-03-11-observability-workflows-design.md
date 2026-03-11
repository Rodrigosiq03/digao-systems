# Observability Workflows Design

**Context**

The repository already has Pulumi GitHub Actions workflows for core stacks such as Prometheus, Redis, RabbitMQ, Keycloak, Nginx Proxy Manager, and Java services. Grafana and Portainer stacks exist under `pulumi/`, but there are no corresponding workflows in `.github/workflows/`, so they cannot be deployed through the same CI/CD path.

**Goal**

Add dedicated workflows for Grafana and Portainer that match the existing Pulumi deployment model:
- `push` with path filtering on `develop` and `main`
- `workflow_dispatch` with explicit stack selection
- automatic `develop -> dev` and `main -> homolog` mapping
- production gated by manual approval

**Design**

Two new workflow files will be added:
- `.github/workflows/pulumi-grafana.yml`
- `.github/workflows/pulumi-portainer.yml`

Both workflows will mirror `pulumi-prometheus.yml` to keep operational behavior consistent. Grafana needs an `Apply secrets` step because the Pulumi stack requires `grafana:adminPassword`; Portainer does not currently require secret injection, so its workflow will omit that step.

**Verification**

Because this is workflow/configuration work, verification will focus on:
- YAML syntax validation
- diff review against the existing Prometheus workflow pattern
- confirming trigger paths, working directories, stack mapping, and Pulumi commands are correct
