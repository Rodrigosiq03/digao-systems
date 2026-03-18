# Portal VPN Access Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist and surface manual VPN access state for Keycloak users in the portal, with ADMIN_MASTER write access, ADMIN read access, and audit logging.

**Architecture:** Extend the auth-service authorization domain with a dedicated `user_vpn_access` resource keyed by `(keycloak_user_id, provider)`, expose admin `GET` and `PUT` endpoints, and compose the resulting data into the portal users experience. Keep Tailscale manual in v1: the portal stores state and operational metadata but does not automate invites.

**Tech Stack:** Spring Boot 4, Spring Security, Spring Data JPA, Flyway, PostgreSQL, React, TanStack Query, Zustand, React Hook Form, Zod.

---

## File Structure

- Modify: `services/java/auth-service/src/main/resources/db/migration/`
  - add migration for `user_vpn_access`
- Create/Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/`
  - entity/repository for VPN access
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/authorization/`
  - service for load/upsert + audit
- Modify/Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/presentation/authorization/`
  - DTOs and controller endpoints
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/`
  - repository, service, controller tests
- Modify: `clients/web/digao-oauth-portal/src/domain/admin.ts`
  - extend user-facing model with VPN metadata or add mapped view model
- Modify: `clients/web/digao-oauth-portal/src/infrastructure/admin/adminApiClient.ts`
  - add VPN access endpoints
- Modify: `clients/web/digao-oauth-portal/src/presentation/hooks/useAdminData.ts`
  - queries/mutations for VPN access
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/userCards.tsx`
  - render VPN access status and actions
- Create/Modify: `clients/web/digao-oauth-portal/src/presentation/forms/`
  - VPN access form or inline editor built with RHF + Zod
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/UsersPage.tsx`
  - compose VPN state into cards and wire mutations
- Test: `clients/web/digao-oauth-portal/tests/`
  - contract tests for VPN API usage and role-gated UI

## Chunk 1: Backend Persistence and Domain

### Task 1: Add failing migration contract test coverage

**Files:**
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationSchemaSmokeTest.java`
- Test: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationSchemaSmokeTest.java`

- [ ] **Step 1: Extend the schema smoke test expectation**

Add assertions for a `user_vpn_access` table with the expected columns and composite key shape.

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationSchemaSmokeTest test`
Expected: FAIL because the migration does not create `user_vpn_access` yet.

- [ ] **Step 3: Add migration V3 for VPN access**

Create `services/java/auth-service/src/main/resources/db/migration/V3__create_user_vpn_access_table.sql` defining:
- `keycloak_user_id`
- `provider`
- `status`
- `invite_link`
- `notes`
- audit timestamps and actor fields
- PK `(keycloak_user_id, provider)`

- [ ] **Step 4: Run schema test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationSchemaSmokeTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/resources/db/migration/V3__create_user_vpn_access_table.sql services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationSchemaSmokeTest.java
git commit -m "feat(auth): add vpn access schema"
```

### Task 2: Add failing repository test for VPN access persistence

**Files:**
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/UserVpnAccessRepositoryTest.java`
- Create/Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/UserVpnAccessEntity.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/UserVpnAccessRepository.java`

- [ ] **Step 1: Write repository test**

Test should persist a VPN access record and reload it by `(keycloakUserId, provider)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=UserVpnAccessRepositoryTest test`
Expected: FAIL because entity/repository do not exist.

- [ ] **Step 3: Implement entity and repository**

Model the composite key explicitly and persist fields from the spec.

- [ ] **Step 4: Run repository test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=UserVpnAccessRepositoryTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/UserVpnAccessEntity.java services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/UserVpnAccessRepository.java services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/UserVpnAccessRepositoryTest.java
git commit -m "feat(auth): persist user vpn access"
```

## Chunk 2: Backend API and Audit

### Task 3: Add failing service test for VPN access upsert and audit

**Files:**
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/UserVpnAccessServiceTest.java`
- Create/Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/authorization/UserVpnAccessService.java`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/authorization/AuditLogService.java`

- [ ] **Step 1: Write service test**

Cover:
- create on first `PUT`
- update on second `PUT`
- audit entry created with before/after payloads

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=UserVpnAccessServiceTest test`
Expected: FAIL because service logic does not exist.

- [ ] **Step 3: Implement minimal service**

Implement upsert semantics and audit emission.

- [ ] **Step 4: Run service test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=UserVpnAccessServiceTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/authorization/UserVpnAccessService.java services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/UserVpnAccessServiceTest.java
git commit -m "feat(auth): add vpn access service"
```

### Task 4: Add failing controller/security test for VPN endpoints

**Files:**
- Modify/Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/presentation/authorization/`
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AdminAuthorizationControllerTest.java`

- [ ] **Step 1: Add controller tests**

Cover:
- `GET /admin/users/{userId}/vpn-access` for `ADMIN_MASTER` and `ADMIN`
- `PUT /admin/users/{userId}/vpn-access/{provider}` only for `ADMIN_MASTER`
- `COMMON` denied

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest test`
Expected: FAIL because endpoints are missing.

- [ ] **Step 3: Implement controller, DTOs, and security wiring**

Keep endpoints in the admin authorization slice, not in the Keycloak user CRUD slice.

- [ ] **Step 4: Run controller test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/presentation/authorization services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AdminAuthorizationControllerTest.java
git commit -m "feat(auth): expose vpn access admin api"
```

## Chunk 3: Frontend Integration

### Task 5: Add failing frontend contract test for VPN API client

**Files:**
- Create: `clients/web/digao-oauth-portal/tests/test_vpn_access_api_contract.py`
- Modify: `clients/web/digao-oauth-portal/src/infrastructure/admin/adminApiClient.ts`
- Modify: `clients/web/digao-oauth-portal/src/domain/admin.ts`

- [ ] **Step 1: Write the failing contract test**

Assert that the admin API client exposes:
- `getUserVpnAccess`
- `putUserVpnAccess`

with URLs under `/admin/users/{userId}/vpn-access`.

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_vpn_access_api_contract -v`
Expected: FAIL because the client methods do not exist.

- [ ] **Step 3: Implement the client contract and domain types**

Add typed DTOs for `vpnAccess` in the admin domain or a dedicated view model.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_vpn_access_api_contract -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/infrastructure/admin/adminApiClient.ts clients/web/digao-oauth-portal/src/domain/admin.ts clients/web/digao-oauth-portal/tests/test_vpn_access_api_contract.py
git commit -m "feat(portal): add vpn access api client"
```

### Task 6: Add failing UI contract test for VPN access in user cards

**Files:**
- Create: `clients/web/digao-oauth-portal/tests/test_user_vpn_access_ui_contract.py`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/userCards.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/UsersPage.tsx`
- Modify/Create: `clients/web/digao-oauth-portal/src/presentation/forms/userVpnAccessForm.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/hooks/useAdminData.ts`

- [ ] **Step 1: Write the failing UI contract test**

Assert that the users UI references:
- VPN status rendering
- provider rendering
- ADMIN_MASTER write actions
- ADMIN read-only mode

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_user_vpn_access_ui_contract -v`
Expected: FAIL because the UI does not mention VPN access yet.

- [ ] **Step 3: Implement hooks, form, and card composition**

Use:
- React Query for `GET` and `PUT`
- RHF + Zod for the update form
- existing local UI primitives in `src/components/ui`

- [ ] **Step 4: Run UI contract test and typecheck**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_user_vpn_access_ui_contract -v`
Expected: PASS.

Run: `cd clients/web/digao-oauth-portal && /home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/presentation/components/userCards.tsx clients/web/digao-oauth-portal/src/presentation/pages/UsersPage.tsx clients/web/digao-oauth-portal/src/presentation/forms/userVpnAccessForm.tsx clients/web/digao-oauth-portal/src/presentation/hooks/useAdminData.ts clients/web/digao-oauth-portal/tests/test_user_vpn_access_ui_contract.py
git commit -m "feat(portal): add vpn access user controls"
```

## Chunk 4: Verification and Rollout

### Task 7: Run end-to-end verification for backend and frontend contracts

**Files:**
- Verify only

- [ ] **Step 1: Run backend test set**

Run:
```bash
./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationSchemaSmokeTest,UserVpnAccessRepositoryTest,UserVpnAccessServiceTest,AdminAuthorizationControllerTest test
```
Expected: PASS.

- [ ] **Step 2: Run frontend contract tests**

Run:
```bash
python3 -m unittest   clients.web.digao-oauth-portal.tests.test_vpn_access_api_contract   clients.web.digao-oauth-portal.tests.test_user_vpn_access_ui_contract -v
```
Expected: PASS.

- [ ] **Step 3: Run frontend typecheck**

Run:
```bash
cd clients/web/digao-oauth-portal && /home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn typecheck
```
Expected: PASS.

- [ ] **Step 4: Deploy auth-service and portal in dev**

Run the existing deploy workflows after merge to `develop` and verify:
- `auth-service` green
- portal green
- users page shows VPN state

- [ ] **Step 5: Commit final cleanup if needed**

```bash
git add -A
git commit -m "chore(portal): finalize vpn access rollout"
```
