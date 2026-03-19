# Auth Metrics, System Update, And Audit Cleanup Design

## Context
The portal authorization domain is already live with systems, profiles, permissions, VPN access, audit logs, and provider sync. A few gaps remain:
- systems can be created and disabled, but not updated
- logical disable actions do not expose direct timestamps on the resource
- audit history still contains noisy historical `user_vpn_access.provider_synced` entries from the earlier VPN sync behavior
- the portal session should return automatically to the public landing page when refresh is no longer possible
- Prometheus is already available through the `auth-service` actuator endpoint, but the new authorization and VPN flows are not instrumented yet

## Goals
- allow updating `name` and `entryUrl` for systems while keeping `key` immutable
- add direct `disabled_at` and `disabled_by` metadata to logical-delete authorization resources
- clean up historical noisy VPN sync audit rows while preserving meaningful state-change history
- expose useful operational metrics for authorization and VPN sync in Prometheus
- redirect the user back to the public landing page when the authenticated session can no longer be refreshed

## Non-Goals
- editing system keys
- physical delete for authorization resources
- moving audit history out of the relational database
- building Grafana dashboards in this pass

## Design

### System update
- backend adds `PUT /admin/systems/{id}`
- allowed fields:
  - `name`
  - `entryUrl`
- `key` remains immutable and continues to identify the system
- portal reuses `SystemForm` for both create and update
- system cards gain an `Editar sistema` quick action
- audit logs record `system.updated`

### Logical disable metadata
- `systems`, `profiles`, and `capabilities` gain:
  - `disabled_at`
  - `disabled_by`
- disabling remains logical via `enabled=false`
- re-disable operations do not overwrite historical disable timestamps unless the entity is re-enabled in a future change
- responses expose the disable metadata so the portal can show it later without rebuilding it from audit history

### Audit cleanup
- the old `user_vpn_access.provider_synced` rows are considered historical noise
- cleanup removes redundant rows that do not represent a meaningful state change
- preserve rows that still correspond to the useful observed activation outcome for the existing owner account
- future sync behavior already emits meaningful actions only:
  - `user_vpn_access.detected`
  - `user_vpn_access.activated`
  - `user_vpn_access.role_changed`

### Prometheus metrics
- instrument the `auth-service` with Micrometer counters for:
  - `digao_auth_audit_events_total{action,target_type}`
  - `digao_auth_vpn_sync_runs_total{provider,status}`
  - `digao_auth_vpn_sync_observed_users_total{provider}`
  - `digao_auth_vpn_sync_matched_users_total{provider}`
  - `digao_auth_vpn_sync_updated_users_total{provider}`
- expose a gauge for current VPN access counts:
  - `digao_auth_user_vpn_access_total{provider,state}`
- Prometheus remains for numeric trends and health, while `audit_logs` remains the detailed forensic timeline

### Session expiry redirect
- keep the current hybrid token handling:
  - pre-request `updateToken(30)`
  - on `401`, attempt refresh and retry once
- if refresh fails definitively:
  - clear the auth store
  - redirect to the public landing page immediately
- do not require a manual click on `Sair` to recover from an expired session

## Verification
- backend tests cover system update, disable metadata, audit cleanup behavior, and Prometheus instrumentation
- frontend tests cover system edit flow contract and automatic landing-page redirect behavior
- portal `typecheck` and `build` remain green
- focused Java test suites remain green
