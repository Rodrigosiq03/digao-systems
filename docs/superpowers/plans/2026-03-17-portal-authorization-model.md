# Portal Authorization Model Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a PostgreSQL-backed authorization domain to the Digao OAuth Portal so `ADMIN_MASTER` can manage systems, capabilities, profiles, and user assignments while `ADMIN` stays read-only and `COMMON` stays out of administrative surfaces.

**Architecture:** Keep Keycloak responsible for identity and global portal roles, and extend the Java `auth-service` with a portal-owned authorization domain stored in PostgreSQL. Expose new admin APIs from `auth-service`, then evolve the React portal to consume them and gate UI by the existing Keycloak role plus the new authorization data.

**Tech Stack:** Java 21, Spring Boot, Spring Security Resource Server, PostgreSQL, Pulumi, Docker, React, Vite, React Query, Keycloak

---

## File Structure

### Backend persistence and config

- Create: `services/java/auth-service/src/main/resources/db/migration/V2__create_portal_authorization_tables.sql`
- Modify: `services/java/auth-service/src/main/resources/application.yaml`
- Modify: `pulumi/auth-service/__main__.py`
- Modify: `.github/workflows/pulumi-services.yml`

### Backend domain and API

- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/SystemEntity.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/CapabilityEntity.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/ProfileEntity.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/ProfileCapabilityEntity.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/UserProfileEntity.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/AuditLogEntity.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/repository/...`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/authorization/...`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/http/admin/...`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/security/SecurityConfig.java`

### Backend tests

- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/...`
- Create: `pulumi/auth-service/tests/test_portal_authorization_db_config.py`

### Frontend domain and API clients

- Create: `clients/web/digao-oauth-portal/src/domain/authorization.ts`
- Create: `clients/web/digao-oauth-portal/src/application/authorization/authorizationPort.ts`
- Create: `clients/web/digao-oauth-portal/src/application/authorization/authorizationUseCases.ts`
- Create: `clients/web/digao-oauth-portal/src/infrastructure/authorization/authorizationApiClient.ts`
- Modify: `clients/web/digao-oauth-portal/src/infrastructure/auth/keycloakClient.ts`
- Modify: `clients/web/digao-oauth-portal/src/presentation/stores/authStore.ts`

### Frontend admin UI

- Create: `clients/web/digao-oauth-portal/src/presentation/hooks/useAuthorizationData.ts`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/SystemsPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/ProfilesPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/CapabilitiesPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/AssignmentsPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/AuditPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/forms/systemForm.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/forms/profileForm.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/forms/capabilityForm.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/forms/userProfileAssignmentForm.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AppShell.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/sidebar.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AdminPage.tsx`

### Frontend tests

- Create: `clients/web/digao-oauth-portal/tests/test_authorization_api_contract.py`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/__tests__/...`

## Chunk 1: Database and deployment backbone

### Task 1: Add failing tests for required authorization config

**Files:**
- Create: `pulumi/auth-service/tests/test_portal_authorization_db_config.py`
- Modify: `pulumi/auth-service/__main__.py`
- Modify: `.github/workflows/pulumi-services.yml`

- [ ] **Step 1: Write the failing test**

Add assertions that the Pulumi stack requires database configuration for the portal authorization domain and that the workflow injects it for `auth-service`.

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest pulumi.auth-service.tests.test_portal_authorization_db_config -v`
Expected: FAIL because the config keys and workflow injection do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add required config handling for the authorization database connection in `pulumi/auth-service/__main__.py` and runtime injection in `.github/workflows/pulumi-services.yml`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest pulumi.auth-service.tests.test_portal_authorization_db_config -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pulumi/auth-service/__main__.py pulumi/auth-service/tests/test_portal_authorization_db_config.py .github/workflows/pulumi-services.yml
git commit -m "test(auth): require portal authorization db config"
```

### Task 2: Add the first migration for authorization tables

**Files:**
- Create: `services/java/auth-service/src/main/resources/db/migration/V2__create_portal_authorization_tables.sql`
- Test: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationSchemaSmokeTest.java`

- [ ] **Step 1: Write the failing test**

Add a migration smoke test that boots a test database and verifies the presence of:

- `systems`
- `capabilities`
- `profiles`
- `profile_capabilities`
- `user_profiles`
- `audit_logs`

- [ ] **Step 2: Run test to verify it fails**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationSchemaSmokeTest test`
Expected: FAIL because the migration does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the migration with:

- primary keys
- foreign keys
- `enabled` flags for mutable business entities
- `created_at`, `created_by`, `updated_at`, `updated_by`
- `revoked_at`, `revoked_by` on assignment tables

- [ ] **Step 4: Run test to verify it passes**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationSchemaSmokeTest test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/resources/db/migration/V2__create_portal_authorization_tables.sql services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationSchemaSmokeTest.java
git commit -m "feat(auth): add authorization schema migration"
```

## Chunk 2: Backend authorization domain

### Task 3: Add JPA entities and repositories

**Files:**
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/*.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/repository/*.java`
- Test: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationRepositoryTest.java`

- [ ] **Step 1: Write the failing test**

Add repository tests for:

- creating systems
- creating capabilities linked to systems
- creating profiles
- assigning capabilities to profiles
- assigning profiles to users

- [ ] **Step 2: Run test to verify it fails**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationRepositoryTest test`
Expected: FAIL because entities and repositories do not exist.

- [ ] **Step 3: Write minimal implementation**

Create entity mappings and repositories with:

- explicit unique constraints
- soft-state fields (`enabled`, `revoked_at`)
- IDs on assignment tables for audit-friendly lifecycle tracking

- [ ] **Step 4: Run test to verify it passes**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationRepositoryTest test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationRepositoryTest.java
git commit -m "feat(auth): add authorization domain entities"
```

### Task 4: Add service layer for systems, capabilities, profiles, assignments, and audit logs

**Files:**
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/authorization/*.java`
- Test: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationServiceTest.java`

- [ ] **Step 1: Write the failing test**

Add service tests for:

- creating and disabling systems
- creating and disabling capabilities
- creating and disabling profiles
- assigning and revoking user profiles
- creating audit rows for each mutation

- [ ] **Step 2: Run test to verify it fails**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationServiceTest test`
Expected: FAIL because service layer does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement focused service classes:

- `SystemAdminService`
- `CapabilityAdminService`
- `ProfileAdminService`
- `UserProfileAdminService`
- `AuditLogService`

- [ ] **Step 4: Run test to verify it passes**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationServiceTest test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/authorization services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationServiceTest.java
git commit -m "feat(auth): add authorization admin services"
```

## Chunk 3: Backend HTTP API and security

### Task 5: Add failing controller tests for admin authorization resources

**Files:**
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AdminAuthorizationControllerTest.java`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/security/SecurityConfig.java`

- [ ] **Step 1: Write the failing test**

Add controller tests for:

- `ADMIN_MASTER` can create and update resources
- `ADMIN` can list and read but gets `403` on writes
- `COMMON` gets `403` on administrative endpoints

- [ ] **Step 2: Run test to verify it fails**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest test`
Expected: FAIL because the new routes and role rules do not exist.

- [ ] **Step 3: Write minimal implementation**

Add controllers and role enforcement for:

- `/admin/systems`
- `/admin/capabilities`
- `/admin/profiles`
- `/admin/profile-capabilities`
- `/admin/user-profiles`
- `/admin/audit-logs`

Keep `ADMIN_MASTER` write-only and `ADMIN` read-only.

- [ ] **Step 4: Run test to verify it passes**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/security/SecurityConfig.java services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/http/admin services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AdminAuthorizationControllerTest.java
git commit -m "feat(auth): expose authorization admin api"
```

### Task 6: Add endpoint to resolve effective capabilities for the current user

**Files:**
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationResolutionTest.java`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/http/admin/...`

- [ ] **Step 1: Write the failing test**

Add tests for a `GET /me/access` style endpoint that returns:

- global portal role
- active profiles
- grouped capabilities by system

- [ ] **Step 2: Run test to verify it fails**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationResolutionTest test`
Expected: FAIL because the endpoint does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement an authenticated endpoint that resolves the current Keycloak user from the JWT subject and returns effective authorization data for the frontend.

- [ ] **Step 4: Run test to verify it passes**

Run: `./mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationResolutionTest test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/http services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationResolutionTest.java
git commit -m "feat(auth): expose effective access resolution endpoint"
```

## Chunk 4: Portal frontend contract and navigation

### Task 7: Add failing frontend contract tests

**Files:**
- Create: `clients/web/digao-oauth-portal/tests/test_authorization_api_contract.py`
- Create: `clients/web/digao-oauth-portal/src/domain/authorization.ts`
- Create: `clients/web/digao-oauth-portal/src/application/authorization/authorizationPort.ts`
- Create: `clients/web/digao-oauth-portal/src/application/authorization/authorizationUseCases.ts`
- Create: `clients/web/digao-oauth-portal/src/infrastructure/authorization/authorizationApiClient.ts`

- [ ] **Step 1: Write the failing test**

Add a lightweight source-contract test that asserts:

- the authorization client exists
- it exposes list and mutate methods for systems, capabilities, profiles, and assignments
- it exposes a `getMyAccess` method

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_authorization_api_contract -v`
Expected: FAIL because the files do not exist.

- [ ] **Step 3: Write minimal implementation**

Create the frontend authorization domain and API client focused on the new backend endpoints.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_authorization_api_contract -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/domain/authorization.ts clients/web/digao-oauth-portal/src/application/authorization clients/web/digao-oauth-portal/src/infrastructure/authorization clients/web/digao-oauth-portal/tests/test_authorization_api_contract.py
git commit -m "feat(portal): add authorization api client contract"
```

### Task 8: Add role-gated navigation and page shells

**Files:**
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AppShell.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/sidebar.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/SystemsPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/ProfilesPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/CapabilitiesPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/AssignmentsPage.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/pages/AuditPage.tsx`
- Test: `clients/web/digao-oauth-portal/src/presentation/pages/__tests__/AppShell.test.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that assert:

- `ADMIN_MASTER` sees all admin sections
- `ADMIN` sees admin sections in read-only mode
- `COMMON` does not see admin sections

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test AppShell --runInBand`
Expected: FAIL because the new navigation and page shells do not exist.

- [ ] **Step 3: Write minimal implementation**

Add the page shells and sidebar entries with role-gated visibility based on existing Keycloak role resolution.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test AppShell --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/presentation/components/sidebar.tsx clients/web/digao-oauth-portal/src/presentation/pages
git commit -m "feat(portal): add authorization admin navigation"
```

## Chunk 5: Portal admin screens

### Task 9: Build read-only listing flows first

**Files:**
- Create: `clients/web/digao-oauth-portal/src/presentation/hooks/useAuthorizationData.ts`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/SystemsPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/ProfilesPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/CapabilitiesPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AssignmentsPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AuditPage.tsx`

- [ ] **Step 1: Write the failing test**

Add page tests for rendering list states, empty states, and read-only states for `ADMIN`.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test authorization-pages --runInBand`
Expected: FAIL because the pages do not consume live data yet.

- [ ] **Step 3: Write minimal implementation**

Use React Query hooks to render:

- systems list
- profiles list
- capabilities list
- assignments list
- audit list

Ensure the `ADMIN` view is read-only.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test authorization-pages --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/presentation/hooks/useAuthorizationData.ts clients/web/digao-oauth-portal/src/presentation/pages
git commit -m "feat(portal): add read-only authorization admin pages"
```

### Task 10: Add mutation flows for ADMIN_MASTER

**Files:**
- Create: `clients/web/digao-oauth-portal/src/presentation/forms/systemForm.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/forms/profileForm.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/forms/capabilityForm.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/forms/userProfileAssignmentForm.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/*.tsx`

- [ ] **Step 1: Write the failing test**

Add mutation flow tests for:

- create system
- disable system
- create profile
- add capability to profile
- assign profile to user

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test authorization-mutations --runInBand`
Expected: FAIL because the forms and mutations do not exist.

- [ ] **Step 3: Write minimal implementation**

Add `ADMIN_MASTER`-only forms and mutation handlers with cache invalidation and optimistic UI only where it is safe.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test authorization-mutations --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/presentation/forms clients/web/digao-oauth-portal/src/presentation/pages
git commit -m "feat(portal): add authorization mutation flows"
```

## Chunk 6: Verification and rollout

### Task 11: End-to-end verification on dev

**Files:**
- Modify: `docs/infra/...` if needed for operator notes

- [ ] **Step 1: Run backend test suite for changed areas**

Run: `./mvnw -f services/java/auth-service/pom.xml test`
Expected: PASS

- [ ] **Step 2: Run frontend tests and build**

Run: `cd clients/web/digao-oauth-portal && yarn test && yarn build`
Expected: PASS

- [ ] **Step 3: Run Pulumi/workflow verification**

Run the targeted workflow or local verification for `auth-service` and confirm the dev runtime boots with the new DB config.

- [ ] **Step 4: Manual verification**

Verify in `portal-dev`:

- `ADMIN_MASTER` can mutate authorization resources
- `ADMIN` can read but cannot mutate
- `COMMON` cannot see admin sections
- audit rows are created for admin writes

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test(portal): verify authorization control plane"
```

