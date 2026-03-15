# History Audit Report

Date: 2026-03-15

## Scope

Audit objective:

- identify whether the public repository or recent GitHub Actions logs contain critical plaintext secret leakage
- separate real secret exposure from topology/config exposure
- decide whether history rewrite is currently justified

## Methods used

### 1. Current tree and Git history search

Checked for tracked local secret files:

```bash
git log --all -- .secrets.local pulumi/.secrets.local
```

Result:

- no tracked history found for `.secrets.local`

Searched Git history for plaintext secret-like assignments across:

- `pulumi`
- `services`
- `.github/workflows`
- `deploy`

Pattern families audited included:

- `password`
- `secret`
- `token`
- `clientSecret`
- `cookieSecret`
- `passphrase`
- `apiKey`

Result:

- no plaintext matches were found in the audited history sample for those critical assignment patterns
- encrypted Pulumi values of the form `secure: v1:...` were excluded from false positives

### 2. GitHub Actions log sampling

Audited recent workflow logs with `gh` for the same critical classes:

- `PULUMI_CONFIG_PASSPHRASE`
- client secrets
- cookie secrets
- plaintext passwords
- unmasked authorization headers
- unmasked tokens

Result:

- recent sampled logs produced `0` findings for plaintext secret leakage
- GitHub masking was observed where sensitive values were present in environment or request contexts

### 3. Topology/config review

Confirmed that the public repository did expose internal operational details in tracked Pulumi stack YAML, such as:

- Docker network names
- internal service hostnames
- internal upstreams
- per-stage port topology

This is a hardening issue, not currently a proven credential compromise.

## Findings

### Confirmed

- public history contained environment topology/config exposure in tracked stack YAML
- no tracked `.secrets.local` history was found
- no plaintext critical secret leakage was proven by the history audit performed here
- no plaintext critical secret leakage was found in the sampled recent GitHub Actions logs audited here

### Not confirmed

- no evidence was found that repository history contains plaintext values for:
  - client secrets
  - cookie secrets
  - Pulumi config passphrase
  - admin passwords for the main platform stack

## Decision

Current recommendation:

- do **not** rewrite public Git history at this time

Reasoning:

- rewrite cost is high
- no concrete plaintext secret leak was proven in the audited platform scope
- the validated issue is topology/config exposure, which is better addressed first by hardening the current branch and future CI behavior

## When rewrite becomes justified

A history rewrite should be reconsidered if a later audit proves that a public commit contains any real plaintext value for:

- client secrets
- cookie secrets
- passwords for live services
- private keys
- Pulumi passphrases
- admin tokens or equivalent runtime credentials

## Required follow-up

- keep live stage stack YAML out of Git going forward
- keep secrets in local secure storage and GitHub Secrets only
- continue periodic log review for new workflows when auth or deployment mechanisms change
