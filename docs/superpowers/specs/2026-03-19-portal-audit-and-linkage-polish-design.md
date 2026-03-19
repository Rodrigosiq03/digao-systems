# Portal Audit And Linkage Polish Design

## Context
The portal admin shell already covers systems, permissions, profiles, assignments, VPN access, and audit logs. Three rough edges remain:
- the `Criar sistema` form still compresses fields into a single row
- linkage actions (`Vincular`) still use an older visual treatment that diverges from the newer theme-toggle palette
- audit logs are too raw and noisy, especially repeated `user_vpn_access.provider_synced` entries that do not represent meaningful change

## Goals
- stack the system creation form vertically like the other admin forms
- align linkage buttons with the newer accent palette already approved in the portal
- make audit logs readable and operationally meaningful
- keep backend audit behavior conservative: log meaningful VPN sync transitions, not every periodic observation

## Non-Goals
- advanced audit filtering and pagination
- changing the authorization model
- redesigning the entire audit domain or introducing event sourcing

## Design

### Forms and buttons
- `SystemForm` moves to a single-column layout
- linkage actions use a shared accent button class derived from the approved theme-toggle treatment
- this accent treatment is reused for:
  - `Vincular perfil`
  - inline `Vincular` in `Perfis`
  - the theme toggle itself, via the same shared class

### Audit signal quality
- VPN sync no longer records `user_vpn_access.provider_synced` on every successful poll
- instead, audit records only when the sync produces a meaningful user-facing change:
  - `user_vpn_access.detected` when an active provider user is matched and no record existed yet
  - `user_vpn_access.activated` when an existing non-active record becomes active
  - `user_vpn_access.role_changed` when provider role changes for an already-known active user
- periodic updates that only refresh timestamps remain persisted but do not create audit noise

### Audit API shape
- audit log responses expose enough data for a useful timeline:
  - `id`
  - `action`
  - `targetType`
  - `targetId`
  - `actorEmail`
  - `createdAt`
- audit listing is returned in reverse chronological order

### Audit UI
- audit entries are grouped into high-level categories derived from action prefixes and semantics:
  - `VPN`
  - `Perfis`
  - `Permissões`
  - `Sistemas`
  - `Acessos`
  - `Outros`
- each entry shows:
  - humanized title
  - supporting description from target type/id
  - actor when available
  - formatted date/time
- VPN entries use human labels such as:
  - `Usuário detectado na VPN`
  - `Acesso VPN ativado`
  - `Papel VPN atualizado`

## Verification
- frontend contract tests cover vertical system form and linkage accent treatment
- frontend contract tests cover enriched audit page usage
- backend tests cover the new VPN sync audit semantics and audit log response shape
- portal typecheck/build and focused Java tests remain green
