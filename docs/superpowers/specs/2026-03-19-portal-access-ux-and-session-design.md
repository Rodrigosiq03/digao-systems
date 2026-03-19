# Portal Access UX And Session Design

## Context

The Digão OAuth portal already has the underlying authorization control plane in place:

- Keycloak provides identity and global portal roles.
- The portal database models `systems`, `capabilities`, `profiles`, `profile_capabilities`, and `user_profiles`.
- Users gain effective access through `user -> profile -> capability -> system`, not through a direct `user -> system` link.
- The portal now also persists VPN access state and syncs provider observations from Tailscale.

The current gap is product UX, not the core model. In the current UI, assigning access feels indirect, some text contrast is too weak, system states are visually timid, the `Capabilities` label is less intuitive than desired, system URLs are not modeled as first-class data, and session renewal behavior is not resilient enough for long-lived admin usage.

## Goals

This package will:

1. Make system access management feel like "linking a user to a system" without breaking the profile/capability model.
2. Improve visual clarity in both light and dark themes.
3. Make system and user statuses more legible and alive through stronger status colors.
4. Rename `Capabilities` to `Permissões` across the product surface.
5. Add a first-class entry URL to systems so the portal can show and launch the official system entry point.
6. Improve session continuity with a hybrid Keycloak refresh flow that avoids unnecessary logouts during normal admin use.

## Non-Goals

This package will not:

- introduce a direct `user_systems` relationship in the database,
- replace Keycloak session management with custom refresh-token storage,
- redesign the full visual identity of the portal,
- add a public system marketplace or user self-service access requests,
- add multiple URLs per system.

## Architecture

### Authorization UX

The underlying authorization model remains unchanged:

- `system` defines the product boundary,
- `capability` belongs to a system,
- `profile` groups capabilities,
- `user_profile` grants those grouped capabilities to a user.

The UI will introduce a system-oriented access management layer on top of this model.

When an admin opens `Gerenciar acessos` for a user, the portal will:

1. load all active systems,
2. resolve which profiles grant access to each system,
3. resolve which profiles the selected user already holds,
4. derive the user's effective access per system,
5. present access decisions in system language rather than raw profile language.

This makes the workflow feel like system assignment while still persisting only `user_profiles`.

### System Entry URL

`systems` will gain a nullable `entry_url` field.

This field represents the canonical web entry point for the system. It is nullable because some systems may not have a public entry URL yet. The portal will display this field in the Systems area and in user access views where it adds value.

This avoids hardcoded links in the frontend and makes the system catalog a real control-plane record instead of a mostly descriptive entity.

### Session Renewal

Protected API requests will use a hybrid Keycloak renewal model:

1. before a protected request, the client will call `updateToken(30)` to renew if the token is near expiry,
2. the request is sent with the current access token,
3. if the API still returns `401`, the client will attempt one refresh/retry cycle,
4. if refresh fails, the client will clear auth state and redirect to login.

The refresh path must be single-flight so concurrent requests do not trigger multiple parallel token refresh operations.

This design prevents many avoidable `401`s while still handling race conditions and real session expiry cleanly.

## Data Model Changes

### `systems`

Add:

- `entry_url text null`

Rules:

- nullable,
- intended for the official system landing URL,
- surfaced to admins and optionally to users where appropriate,
- validated as a URL at the API boundary.

No other schema changes are required for the access UX package.

## Frontend UX

### Users: Access By System

The user access sheet will move from a raw profile-centric flow to a system-first flow.

For each system, the UI should show:

- system name,
- system key,
- direct URL if available,
- current effective access summary,
- supporting profiles currently assigned that produce that access,
- action to `Conceder acesso` or `Trocar acesso`.

Selecting a system action will open a narrower selection flow showing only profiles that grant access to that system.

The admin is still choosing a profile under the hood, but the user experience is now system-oriented and understandable.

### Systems

The Systems page will show the new `entry_url` field and allow `ADMIN_MASTER` to create or update it. When present, the UI should expose an `Abrir sistema` action.

### Terminology

Rename `Capabilities` to `Permissões` throughout the product UI.

This includes:

- sidebar label,
- page title and description,
- sheet titles,
- buttons and helper copy where the product is talking to humans.

Internal code identifiers may remain capability-based where that avoids unnecessary churn.

### Visual Contrast And Status Language

Both light and dark themes need stronger contrast for important text and clearer visual hierarchy.

This package will:

- raise contrast for low-emphasis text that is currently too washed out,
- improve visibility of topbar actions such as `Sair`,
- keep the interface clean while increasing readability,
- establish a consistent status color system.

Recommended status palette:

- `Ativo`: green,
- `Inativo` / `Revogado`: red,
- `Convite pendente`: amber,
- neutral or unknown states remain muted but readable.

The goal is not saturation for its own sake; it is operational legibility.

## Backend And API Changes

### Systems API

Extend system DTOs and write flows to support `entry_url`.

This includes:

- read responses,
- create or update validation,
- persistence mapping.

### Access Resolution For User UX

The backend already exposes the primitives needed to derive access. If possible, the frontend can assemble the system-first view from existing endpoints. If the resulting client code becomes too tangled, add a focused read endpoint that returns effective access grouped by system for a specific user.

That endpoint should be read-only and derived from the existing authorization model, not a new persistence model.

### Auth Client

Centralize protected requests behind a shared API client that:

- obtains the current token,
- preflights with `updateToken(30)`,
- retries once on `401` after refresh,
- prevents multiple concurrent refreshes,
- redirects cleanly on terminal auth failure.

## Security

- No custom refresh token storage in local persistence.
- Continue using `keycloak-js` as the browser session authority.
- Retry at most once per request after a `401`.
- Do not silently loop refresh attempts.
- `entry_url` values must be validated and treated as untrusted input until normalized.

## Testing

### Frontend

Add or update tests for:

- `Permissões` naming in navigation and page content,
- access-management flow grouped by system,
- `entry_url` rendering and direct-link actions,
- status badge styling and text semantics,
- auth client behavior for:
  - preflight refresh,
  - single-flight refresh,
  - `401 -> refresh -> retry`,
  - redirect on refresh failure.

### Backend

Add or update tests for:

- system DTO or entity support for `entry_url`,
- URL validation rules,
- any new effective-access read adapter if introduced.

## Rollout

1. Add `entry_url` to the systems model and APIs.
2. Improve the auth client refresh behavior.
3. Rename `Capabilities` to `Permissões` in the UI.
4. Refactor user access management into a system-first experience.
5. Apply contrast and status-color refinements across the admin shell.
6. Validate in `portal-dev` with real `ADMIN_MASTER`, `ADMIN`, and `COMMON` sessions.
