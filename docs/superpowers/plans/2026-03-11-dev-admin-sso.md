# Dev Admin SSO Plan

## Scope
Implement the minimum viable admin SSO for `dev` using one shared Keycloak OIDC client (`admin-ui-dev`) and dedicated `oauth2-proxy` instances in front of `grafana-dev`, `metrics-dev`, and `portainer`.

## Design Summary
- Keep `NPM admin` out of the hard dependency chain. It stays with break-glass private access.
- Add a new Pulumi project for `oauth2-proxy`.
- Bootstrap a shared OIDC client in Keycloak through the Admin API so the client secret stays out of Git.
- Attach each `oauth2-proxy` instance to the Docker network of the UI it protects so NPM can forward to it directly.
- Keep one small proxy per admin UI to avoid custom Nginx auth snippets in NPM.
- Centralize new client secrets in `pulumi/.secrets.local` and support them in `pulumi/scripts/apply-secrets.py`.
- Add CI workflow for the new Pulumi project.
- Document the NPM proxy-host pattern and required config for auth redirects and callbacks.

## Files To Add Or Change
- `.gitignore`: add `worktrees/` ignore entry.
- `pulumi/oauth2-proxy/Pulumi.yaml`: new Pulumi project definition.
- `pulumi/oauth2-proxy/__main__.py`: deploy the oauth2-proxy containers and the Keycloak bootstrap helper.
- `pulumi/oauth2-proxy/Pulumi.dev.yaml`: dev stack config.
- `pulumi/oauth2-proxy/Pulumi.homolog.yaml`: homolog placeholder config.
- `pulumi/oauth2-proxy/requirements.txt`: Pulumi Python deps.
- `pulumi/oauth2-proxy/bootstrap_keycloak_client.py`: create/update the shared Keycloak OIDC client through the Admin API.
- `pulumi/scripts/apply-secrets.py`: support `oauth2-proxy` secrets.
- `pulumi/README.md`: mention the new project and secret flow.
- `.github/workflows/pulumi-oauth2-proxy.yml`: deploy workflow.
- `docs/infra/sso-observability-target.md`: align with implemented flow.
- `docs/infra/dev-admin-sso-runbook.md`: operational steps for NPM host wiring and validation.

## Chunk 1: Infra skeleton and secrets support
- [ ] Update `.gitignore` to ignore `worktrees/`.
- [ ] Create `pulumi/oauth2-proxy` project with stack files and container definition.
- [ ] Extend `apply-secrets.py` with `oauth2-proxy` support.
- [ ] Update `pulumi/README.md`.
- [ ] Add workflow `.github/workflows/pulumi-oauth2-proxy.yml`.
- [ ] Verify Python files parse.

Verification:
- `python3 -m py_compile pulumi/oauth2-proxy/__main__.py pulumi/scripts/apply-secrets.py`

## Chunk 2: Keycloak client and docs
- [ ] Add bootstrap logic for `admin-ui-dev` client creation/update in Keycloak.
- [ ] Document redirect/callback URLs.
- [ ] Write runbook for NPM config for `grafana-dev`, `metrics-dev`, and `portainer` using their dedicated `oauth2-proxy` upstreams.

Verification:
- manual review of the bootstrap payload and redirect URI coverage

## Chunk 3: Final review and git hygiene
- [ ] Run targeted verification commands.
- [ ] Review changed files for consistency with existing Pulumi patterns.
- [ ] Commit in small, logical units.
