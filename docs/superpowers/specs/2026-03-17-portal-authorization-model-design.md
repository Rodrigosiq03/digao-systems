# Portal Authorization Model Design

## Context

The Digao OAuth Portal already uses Keycloak for authentication and global portal roles:

- `ADMIN_MASTER`
- `ADMIN`
- `COMMON`

The portal frontend authenticates through Keycloak and calls the Java `auth-service` with bearer tokens. The next stage is to turn the portal into the control plane for platform access across Digao Systems.

This design separates identity from product authorization:

- Keycloak remains the source of identity and global portal roles.
- The portal gains its own authorization model for systems, capabilities, profiles, and user assignments.
- `ADMIN_MASTER` can manage the authorization model.
- `ADMIN` can read administrative data but cannot mutate it.
- `COMMON` can only see non-administrative functionality relevant to their own usage.

## Goals

- Allow `ADMIN_MASTER` to create, update, disable, list, and inspect:
  - systems
  - capabilities
  - profiles
  - user/profile assignments
- Keep Keycloak responsible for:
  - login/session
  - user identity
  - global portal roles
- Model platform access dynamically so systems can evolve without hardcoded permission enums in Keycloak.
- Provide strong auditability for all access-management changes.
- Keep the data model maintainable for a single-instance deployment.

## Non-goals

- Replacing Keycloak as the identity provider.
- Moving all per-system authorization into Keycloak groups or client roles.
- Solving every downstream system integration in the first delivery.
- Exposing administrative surfaces to `COMMON` users.

## Recommended Architecture

### Identity and global authorization

Keycloak remains responsible for authenticating users and providing the global portal role through the access token:

- `ADMIN_MASTER`
- `ADMIN`
- `COMMON`

These roles govern what users can do inside the portal itself:

- `ADMIN_MASTER`: full write access to the authorization control plane.
- `ADMIN`: read-only access to administrative sections.
- `COMMON`: no access to administrative sections.

### Product authorization

The portal owns product and system authorization in its own database and API.

The portal authorization model is built around four concepts:

- `system`: a platform product or managed service, such as `cloud-gaming`, `grafana`, `digao-oauth-portal`
- `capability`: a dynamic permission inside a system, such as `catalog.manage`, `catalog.view`, `alerts.view`
- `profile`: a named bundle of capabilities that can span one or more systems
- `user assignment`: links a Keycloak user to one or more profiles

This model supports dynamic, system-specific permissions without forcing every new feature into Keycloak.

## Why not put everything in Keycloak?

Keycloak is a good identity provider and works well for authentication and coarse global roles. It is not the best source of truth for a growing internal catalog of platform systems, dynamic capabilities, operational metadata, and domain-specific admin workflows.

Using Keycloak for everything would create these problems:

- dynamic system permission modeling becomes awkward
- operational metadata becomes hard to manage
- application-specific admin workflows get coupled to IdP internals
- future evolution of platform systems becomes slower and less explicit

## Database recommendation

Use PostgreSQL.

This domain is relational and should not use NoSQL as the primary store. The model needs:

- referential integrity
- uniqueness guarantees
- transactional writes
- auditability
- straightforward joins and admin queries

Recommended database layout:

- keep Keycloak on its existing dedicated PostgreSQL instance
- introduce a shared application PostgreSQL instance for internal services
- create a dedicated database for the portal authorization domain, for example `digao_oauth_portal`

This isolates Keycloak while keeping operations simple for a single host.

## Data model

### systems

Represents platform products or services.

Fields:

- `id`
- `key` unique stable identifier
- `name`
- `description`
- `enabled`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

### capabilities

Represents dynamic permissions within a system.

Fields:

- `id`
- `system_id`
- `key` unique within the system
- `name`
- `description`
- `enabled`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Examples:

- `catalog.view`
- `catalog.manage`
- `sessions.view`
- `sessions.manage`

### profiles

Represents a reusable bundle of capabilities.

Fields:

- `id`
- `key` unique
- `name`
- `description`
- `enabled`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

### profile_capabilities

Links profiles to capabilities.

Fields:

- `id`
- `profile_id`
- `capability_id`
- `created_at`
- `created_by`
- `revoked_at`
- `revoked_by`

Use uniqueness rules so the same active capability grant is not duplicated for a profile.

### user_profiles

Links Keycloak users to profiles.

Fields:

- `id`
- `keycloak_user_id`
- `profile_id`
- `created_at`
- `created_by`
- `revoked_at`
- `revoked_by`

This uses a technical `id` because access management is audit-sensitive and the lifecycle of assignments matters.

### audit_logs

Records all administrative changes.

Fields:

- `id`
- `actor_user_id`
- `actor_email`
- `action`
- `target_type`
- `target_id`
- `before_json`
- `after_json`
- `created_at`

## Authorization rules inside the portal

### ADMIN_MASTER

Can:

- create, update, disable, list, and inspect systems
- create, update, disable, list, and inspect capabilities
- create, update, disable, list, and inspect profiles
- assign and revoke profiles for users
- read audit logs

### ADMIN

Can:

- read systems
- read capabilities
- read profiles
- read user assignments
- read administrative views where appropriate
- not mutate the authorization model

### COMMON

Can:

- access only non-administrative product functionality relevant to their own use
- not see administrative sections
- not see management data for systems, profiles, capabilities, users, or audit logs

## Effective permission resolution

The system computes a user’s effective platform access as follows:

1. authenticate user via Keycloak
2. read the global portal role from the token
3. if the user enters an administrative area, enforce the global portal role first
4. resolve active user profile assignments from the portal database
5. resolve active capabilities granted by those profiles
6. group the resulting capabilities by system

Capabilities are additive. This is intentional.

Example:

A user may keep ordinary viewing rights for `cloud-gaming` while also receiving a focused admin capability such as `catalog.manage`. That does not require upgrading them to a global admin role for the whole system.

## Mutation model

Avoid hard deletes for important authorization objects.

Recommended approach:

- `systems`, `capabilities`, `profiles`: disable instead of deleting
- `user_profiles`, `profile_capabilities`: revoke instead of deleting

This keeps the model auditable and operationally safe.

## API design direction

The Java `auth-service` becomes the backend for the authorization control plane.

Initial resource families:

- `GET/POST/PATCH /admin/systems`
- `GET/POST/PATCH /admin/capabilities`
- `GET/POST/PATCH /admin/profiles`
- `GET/POST/PATCH /admin/profile-capabilities`
- `GET/POST/PATCH /admin/user-profiles`
- `GET /admin/audit-logs`

Write endpoints are restricted to `ADMIN_MASTER`.
Read endpoints are visible to `ADMIN_MASTER` and `ADMIN`.
Administrative endpoints are not visible to `COMMON`.

## Frontend direction

The portal frontend evolves from a user/group admin UI into a broader control plane.

New administrative areas:

- `Users`
- `Systems`
- `Profiles`
- `Capabilities`
- `Assignments`
- `Audit`

Visibility rules:

- `ADMIN_MASTER`: full UI
- `ADMIN`: read-only UI for admin areas
- `COMMON`: no admin areas

## Observability

Minimum observability from the first implementation:

- structured logs for administrative mutations
- audit row creation for every admin mutation
- metrics:
  - total systems
  - total capabilities
  - total profiles
  - total active user-profile assignments

## Rollout plan

### Phase 1

- add PostgreSQL persistence for the portal authorization domain
- create schema and migrations
- keep Keycloak as identity only

### Phase 2

- add backend entities, repositories, service layer, and admin endpoints
- enforce role-based access for `ADMIN_MASTER` and `ADMIN`
- add audit logging

### Phase 3

- add frontend screens for systems, capabilities, profiles, and assignments
- start with list and detail views
- then add mutation flows for `ADMIN_MASTER`

### Phase 4

- integrate downstream systems with resolved portal capabilities
- start with new or actively developed systems first

## Recommendation summary

Use Keycloak for identity and global portal roles. Use PostgreSQL plus the portal backend for dynamic product authorization. Keep systems, capabilities, profiles, and user assignments in the portal domain. Build with strong auditability from the start. Restrict mutation to `ADMIN_MASTER`, allow `ADMIN` read-only access to administrative areas, and keep `COMMON` out of administrative surfaces entirely.
