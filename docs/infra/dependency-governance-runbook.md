# Dependency Governance Runbook

## Scope

This repository uses a pragmatic lock policy:

- Pulumi Python dependencies must be pinned with exact versions.
- Docker images for infrastructure components must avoid `latest`.
- GitHub Actions must not track `main`, `master`, or `latest`.

The current baseline does not yet pin GitHub Actions by commit SHA. Major-version pins such as `actions/checkout@v4` are accepted for now.

## Audit

Run the local audit before opening a PR that changes CI or infrastructure dependencies:

```bash
./pulumi/scripts/audit-version-governance.sh
```

The audit fails when it finds:

- unpinned Pulumi Python requirements
- Docker images on `latest`
- GitHub Actions tracking moving branches or tags

## Updating nginx-proxy-manager

`nginx-proxy-manager` is pinned by image digest, not by floating tag.

To update it:

1. Pull the intended image reference.
2. Capture its digest.
3. Replace `nginx-proxy-manager:imageRef` in:
   - `pulumi/nginx-proxy-manager/Pulumi.dev.yaml`
   - `pulumi/nginx-proxy-manager/Pulumi.homolog.yaml`
   - `pulumi/nginx-proxy-manager/Pulumi.prod.yaml`
4. Run the audit script.
5. Deploy one environment at a time.

## Policy Notes

- Environment-specific secrets stay out of Git and belong in GitHub Environment Secrets.
- Shared secrets belong in repository secrets when they are truly common.
- Fallback admin credentials stay in the local operator vault, outside the repository.
