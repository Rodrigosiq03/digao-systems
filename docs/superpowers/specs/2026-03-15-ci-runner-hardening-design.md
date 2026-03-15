# CI Runner, Pipeline And Public Repo Hardening Design

## Goal
Reduce total CI turnaround time on the self-hosted infrastructure, remove avoidable workflow serialization bottlenecks, and harden the public repository/CI surface so only intended information reaches GitHub.

## Scope
This design covers four connected areas:
- split CI load across two self-hosted runners on the same host
- harden and modernize the runner host/runtime, including Node 24 readiness
- keep optimizing the hottest workflows with persistent warm state
- audit current public history and CI surfaces to decide whether rewrite/cleanup is necessary

Primary workflows in scope:
- `pulumi-services`
- `pulumi-keycloak`
- `pulumi-grafana`
- `pulumi-prometheus`
- `pulumi-nginx-proxy-manager`
- `version-governance`

Out of scope for this iteration:
- moving CI off the current host
- full immutable build images for every workflow
- secret-provider migration beyond the current GitHub Secrets and local `.secrets.local` model
- retroactive history rewrite unless the audit proves it is justified

## Problem Statement
The current CI improvements reduced per-job bootstrap waste, but the system still has two structural limits:

1. one self-hosted runner handles all work, so hot workflows still serialize even when their individual steps are fast
2. the public repository still contains or has contained more environment topology than necessary, and there is no completed decision yet on whether historical cleanup is required

There is also an operational deadline:
- GitHub Actions is deprecating Node 20 for JavaScript actions, so the runner and workflows need to be moved to a Node 24-compatible posture before that becomes a forced default.

## Requirements
### Performance
- hot workflows should reuse warm state safely
- total turnaround should improve when multiple workflows trigger from the same push
- `pulumi-services` must stop blocking lighter infrastructure workflows on the same runner
- deploy semantics must stay equivalent to the current branch behavior

### Operations
- runner changes must be understandable and recoverable from the host
- we must preserve a clear mapping of which runner is meant for which workload
- manual approval behavior for production gates must keep working

### Security and Exposure Control
- real environment stack files must stop being the public source of truth
- secrets must remain outside the public repo
- the Git history and CI logs must be audited completely enough to support a rewrite/no-rewrite decision
- the final state must clearly separate what is public, what is private operational config, and what is secret

## Recommended Approach
Use two self-hosted runners on the same host with explicit labels, keep the workflows on warm persistent state, then remove public stack configs in favor of generated runtime stack files and complete a history/log audit.

This is the best fit because:
- it attacks the actual bottleneck left after workflow optimization: runner serialization
- it avoids replatforming CI
- it preserves the current deployment model
- it gives a clean path to hardening the public repository without blocking current work

## Alternatives Considered
### 1. Continue optimizing workflows only
Not recommended.
Pros:
- smallest code change surface
- no host changes
Cons:
- leaves the single-runner bottleneck intact
- total wait time remains poor whenever multiple workflows trigger together

### 2. One runner plus heavier cache tricks
Not recommended.
Pros:
- less operational change than multiple runners
Cons:
- still bottlenecked by one worker
- complexity grows while the root scheduling limit remains

### 3. Full CI replatform or immutable build farm
Not recommended now.
Pros:
- strongest long-term reproducibility
Cons:
- much larger scope than needed
- delays the immediate gains you want on the current host

## Detailed Design
### 1. Runner Topology
Create a second self-hosted runner service on the same machine.

Proposed labels:
- runner A: `self-hosted`, `linux`, `x64`, `infra-light`
- runner B: `self-hosted`, `linux`, `x64`, `infra-heavy`

Routing:
- `pulumi-services` -> `infra-heavy`
- `pulumi-keycloak` -> `infra-light`
- `pulumi-grafana` -> `infra-light`
- `pulumi-prometheus` -> `infra-light`
- `pulumi-nginx-proxy-manager` -> `infra-light`
- `version-governance` -> `infra-light`

Rationale:
- `pulumi-services` is the heaviest recurring workflow because it builds jars, builds images, and updates containers
- the lighter infrastructure workflows should not wait behind it
- this preserves a simple scheduling model without introducing cluster-level complexity

### 2. Runner Host Hardening And Modernization
The host runner setup should be adjusted so JavaScript actions run in a Node 24-compatible posture and the runtime remains predictable.

Changes:
- inspect the current runner installation and service scripts
- update the active runner runtime to Node 24 where supported
- validate current action versions used by hot workflows, especially:
  - `actions/checkout`
  - `dorny/paths-filter`
  - `trstringer/manual-approval`
- keep warm caches and toolchains in host-owned locations
- make the runner services explicit and documented so restart/recovery is routine

Operational rule:
- runner-local warm state remains acceptable, but the workflows must continue validating venv health instead of assuming it blindly

### 3. Workflow Continuation
The current workflow optimization work stays in place and becomes the baseline.

That baseline includes:
- persistent venvs
- incremental pip install based on `requirements.txt`
- persistent Maven repo
- timing markers
- minimized image contexts for service Docker builds
- concurrency per workflow/ref

The remaining workflow work in this design is not to reinvent that path, but to:
- route workflows to the correct runner labels
- clean up any remaining Node 20 compatibility issues
- ensure the warm-state assumptions are consistent between both runners

### 4. Public Repo Hardening
Move away from publicly tracked real stack configs.

Target state:
- repo keeps `Pulumi.yaml`
- repo may keep minimal templates/examples
- real stack config is generated at runtime in CI from:
  - repository secrets for shared sensitive values
  - environment secrets for stage-specific sensitive values
  - optional non-sensitive defaults embedded in code or templates only when they are intentionally public

Operational local state:
- `.secrets.local` remains the local operational source of truth for break-glass and manual runs
- local real stack config files remain outside Git

This ensures the public repo is limited to code and intentional templates, not live environment topology.

### 5. History And CI Audit
Audit the public surface completely before deciding whether any history rewrite is warranted.

Audit targets:
- current default branch files
- reachable Git history for sensitive paths and patterns
- workflow logs for recently executed runs
- past generated configs and stack files

Classification of findings:
- `secret real`
- `topology/config internal`
- `low-impact/local-only noise`

Decision rule:
- `secret real` -> rotate immediately and evaluate history rewrite/removal
- `topology/config internal` -> harden current branch first, then decide whether rewrite materially improves risk
- `noise` -> document and ignore

The result must be a concrete decision:
- no rewrite needed
- targeted rewrite needed
- rewrite not worth the operational cost, but rotate/harden now

## Migration Strategy
1. create and register a second runner on the host
2. update hot workflows to target explicit runner labels
3. validate runner services and Node 24 compatibility
4. move stack config generation out of public tracked files for the selected projects
5. complete the history/log audit and produce the rewrite decision
6. only then consider broader rollout to the remaining workflows

## Success Criteria
- at least two self-hosted runners are online and routable by label
- `pulumi-services` no longer blocks the lighter infra workflows on the same queue
- hot workflows remain green under the new runner routing
- runner host is in a Node 24-ready posture for the active JavaScript actions
- real public stack files are removed or reduced to safe templates for the targeted surfaces
- a written audit decision exists for historical cleanup/rewrite, backed by evidence rather than guesswork
