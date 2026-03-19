# Portal Access UX And Session Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make portal access management feel system-oriented, improve session resilience, strengthen theme contrast and status colors, and add system entry URLs without changing the underlying authorization model.

**Architecture:** Keep the authorization model as `user -> profile -> capability -> system`, but add a system-first read and interaction layer in the frontend. Introduce `entry_url` as a first-class system attribute and centralize protected API calls behind a Keycloak-aware client that preflights refresh and retries once on `401`.

**Tech Stack:** React, TypeScript, Zustand, React Query, Keycloak JS, Spring Boot, JPA, PostgreSQL, Tailwind CSS, Python contract tests, Maven tests.

---

## Chunk 1: Systems Entry URL

### Task 1: Add `entry_url` to the systems schema and backend model

**Files:**
- Modify: `services/java/auth-service/src/main/resources/db/migration/V2__create_portal_authorization_tables.sql`
- Create: `services/java/auth-service/src/main/resources/db/migration/V5__add_entry_url_to_systems.sql`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/SystemEntity.java`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/dto/authorization/*System*.java`
- Test: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/*`

- [ ] **Step 1: Write the failing backend test**

Create or extend a test that reads systems from the API and expects `entryUrl` to be present in the payload and persisted after write.

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest test`
Expected: FAIL because `entryUrl` is missing or ignored.

- [ ] **Step 3: Add the migration and persistence field**

Create `V5__add_entry_url_to_systems.sql` and add the nullable field to `SystemEntity`.

- [ ] **Step 4: Update DTOs, service mapping, and validation**

Expose `entryUrl` in the create/read flows and validate that, when provided, it is a syntactically valid URL.

- [ ] **Step 5: Run backend tests**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest,AuthorizationRepositoryTest test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/java/auth-service/src/main/resources/db/migration/V5__add_entry_url_to_systems.sql services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/SystemEntity.java services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/dto/authorization
git commit -m "feat(auth): add system entry url"
```

## Chunk 2: Protected API Client And Session Refresh

### Task 2: Centralize protected requests with hybrid refresh behavior

**Files:**
- Modify: `clients/web/digao-oauth-portal/src/infrastructure/auth/keycloakClient.ts`
- Create: `clients/web/digao-oauth-portal/src/infrastructure/http/protectedApiClient.ts`
- Modify: `clients/web/digao-oauth-portal/src/infrastructure/admin/adminApiClient.ts`
- Modify: `clients/web/digao-oauth-portal/src/infrastructure/authorization/authorizationApiClient.ts`
- Test: `clients/web/digao-oauth-portal/tests/test_auth_session_contract.py`

- [ ] **Step 1: Write the failing contract test**

Add a test that expects the protected client to:
- call refresh preflight,
- retry once after `401`,
- avoid multiple simultaneous refresh attempts.

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest clients/web/digao-oauth-portal/tests/test_auth_session_contract.py -v`
Expected: FAIL because the client does not yet implement the shared behavior.

- [ ] **Step 3: Implement the protected client**

Create a small shared client module that:
- calls `updateToken(30)` before protected requests,
- retries once after `401`,
- shares one refresh promise across concurrent callers.

- [ ] **Step 4: Move admin and authorization clients onto the shared client**

Remove duplicate token plumbing from individual API clients and route protected calls through the new helper.

- [ ] **Step 5: Run frontend auth tests**

Run: `python3 -m unittest clients/web/digao-oauth-portal/tests/test_auth_session_contract.py -v`
Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run: `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd /data/apps/worktrees/runner-fleet-routing/clients/web/digao-oauth-portal typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add clients/web/digao-oauth-portal/src/infrastructure/auth/keycloakClient.ts clients/web/digao-oauth-portal/src/infrastructure/http/protectedApiClient.ts clients/web/digao-oauth-portal/src/infrastructure/admin/adminApiClient.ts clients/web/digao-oauth-portal/src/infrastructure/authorization/authorizationApiClient.ts clients/web/digao-oauth-portal/tests/test_auth_session_contract.py
git commit -m "feat(portal): refresh protected sessions reliably"
```

## Chunk 3: Rename `Capabilities` To `Permissões`

### Task 3: Update product-facing labels and navigation

**Files:**
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/sidebar.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/CapabilitiesPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/forms/*`
- Test: `clients/web/digao-oauth-portal/tests/test_authorization_navigation_contract.py`
- Test: `clients/web/digao-oauth-portal/tests/test_authorization_pages_contract.py`

- [ ] **Step 1: Write or extend failing text contract tests**

Update tests to expect `Permissões` in navigation and visible product copy.

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest clients/web/digao-oauth-portal/tests/test_authorization_navigation_contract.py clients/web/digao-oauth-portal/tests/test_authorization_pages_contract.py -v`
Expected: FAIL on old `Capabilities` text.

- [ ] **Step 3: Update UI copy**

Rename the product-facing label everywhere user-facing while keeping internal identifiers stable if that reduces churn.

- [ ] **Step 4: Re-run the navigation and page tests**

Run: `python3 -m unittest clients/web/digao-oauth-portal/tests/test_authorization_navigation_contract.py clients/web/digao-oauth-portal/tests/test_authorization_pages_contract.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/presentation/components/sidebar.tsx clients/web/digao-oauth-portal/src/presentation/pages/CapabilitiesPage.tsx clients/web/digao-oauth-portal/src/presentation/forms clients/web/digao-oauth-portal/tests/test_authorization_navigation_contract.py clients/web/digao-oauth-portal/tests/test_authorization_pages_contract.py
git commit -m "feat(portal): rename capabilities to permissoes"
```

## Chunk 4: System-First Access Management For Users

### Task 4: Add a system-oriented user access view

**Files:**
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/UsersPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/forms/userProfileAssignmentForm.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/components/userSystemAccessList.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/components/userSystemAccessSheet.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/hooks/useAuthorizationData.ts`
- Modify: `clients/web/digao-oauth-portal/src/domain/authorization.ts`
- Test: `clients/web/digao-oauth-portal/tests/test_user_system_access_contract.py`

- [ ] **Step 1: Write the failing contract test**

Add a test that expects the user access workflow to group data by system and show only relevant profiles when granting or replacing access.

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest clients/web/digao-oauth-portal/tests/test_user_system_access_contract.py -v`
Expected: FAIL because the UI is still profile-first.

- [ ] **Step 3: Build derived access-by-system view models**

Use existing authorization queries to derive:
- systems,
- relevant profiles per system,
- current assignments per user,
- effective access summary.

- [ ] **Step 4: Build the system-first access sheet**

Show each system as an access record with:
- name,
- key,
- direct URL if present,
- current access summary,
- action to grant or swap access.

- [ ] **Step 5: Keep persistence on `user_profiles`**

When the admin chooses a profile for a system, continue writing only `user_profiles`. Do not introduce direct `user -> system` persistence.

- [ ] **Step 6: Run UI contract tests**

Run: `python3 -m unittest clients/web/digao-oauth-portal/tests/test_user_system_access_contract.py clients/web/digao-oauth-portal/tests/test_authorization_pages_contract.py -v`
Expected: PASS.

- [ ] **Step 7: Run typecheck**

Run: `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd /data/apps/worktrees/runner-fleet-routing/clients/web/digao-oauth-portal typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add clients/web/digao-oauth-portal/src/presentation/pages/UsersPage.tsx clients/web/digao-oauth-portal/src/presentation/forms/userProfileAssignmentForm.tsx clients/web/digao-oauth-portal/src/presentation/components/userSystemAccessList.tsx clients/web/digao-oauth-portal/src/presentation/components/userSystemAccessSheet.tsx clients/web/digao-oauth-portal/src/presentation/hooks/useAuthorizationData.ts clients/web/digao-oauth-portal/src/domain/authorization.ts clients/web/digao-oauth-portal/tests/test_user_system_access_contract.py
git commit -m "feat(portal): manage user access by system"
```

## Chunk 5: Contrast And Status System

### Task 5: Improve readability and strengthen status colors

**Files:**
- Modify: `clients/web/digao-oauth-portal/src/index.css`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/topbar.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/resourceCard.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/userCards.tsx`
- Create: `clients/web/digao-oauth-portal/src/presentation/components/statusBadge.tsx`
- Test: `clients/web/digao-oauth-portal/tests/test_status_visual_contract.py`
- Test: `clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py`

- [ ] **Step 1: Write failing visual contract tests**

Add tests that expect explicit status badge semantics and stronger action visibility for elements like `Sair`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest clients/web/digao-oauth-portal/tests/test_status_visual_contract.py clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py -v`
Expected: FAIL against the current muted presentation.

- [ ] **Step 3: Add a shared status badge primitive**

Implement a reusable component for:
- active,
- inactive,
- revoked,
- invite pending,
- neutral states.

- [ ] **Step 4: Refine theme tokens and action contrast**

Adjust theme variables and topbar/button usage so important actions remain readable in both light and dark mode.

- [ ] **Step 5: Apply the badge and contrast updates across admin cards**

Update user, system, VPN, and authorization-related surfaces that currently rely on weak muted text.

- [ ] **Step 6: Run visual contract tests and typecheck**

Run:
- `python3 -m unittest clients/web/digao-oauth-portal/tests/test_status_visual_contract.py clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py -v`
- `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd /data/apps/worktrees/runner-fleet-routing/clients/web/digao-oauth-portal typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add clients/web/digao-oauth-portal/src/index.css clients/web/digao-oauth-portal/src/presentation/components/topbar.tsx clients/web/digao-oauth-portal/src/presentation/components/resourceCard.tsx clients/web/digao-oauth-portal/src/presentation/components/userCards.tsx clients/web/digao-oauth-portal/src/presentation/components/statusBadge.tsx clients/web/digao-oauth-portal/tests/test_status_visual_contract.py clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py
git commit -m "feat(portal): improve contrast and status hierarchy"
```

## Chunk 6: Final Verification And Dev Validation

### Task 6: Verify end-to-end behavior in portal dev

**Files:**
- Modify: `clients/web/digao-oauth-portal/...` as needed from prior tasks
- Modify: `services/java/auth-service/...` as needed from prior tasks

- [ ] **Step 1: Run frontend build**

Run: `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd /data/apps/worktrees/runner-fleet-routing/clients/web/digao-oauth-portal build`
Expected: PASS.

- [ ] **Step 2: Run focused backend tests**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest,AuthorizationRepositoryTest,AuthorizationResolutionTest test`
Expected: PASS.

- [ ] **Step 3: Run `git diff --check`**

Run: `git diff --check`
Expected: no output.

- [ ] **Step 4: Push and allow deploy**

```bash
git push origin develop
```

- [ ] **Step 5: Validate in `portal-dev`**

Confirm with real sessions:
- `Permissões` label is present,
- systems show direct URL when configured,
- user access management is system-first,
- contrast is improved in light and dark mode,
- status colors are explicit,
- session survives normal token expiry through refresh and retry.

- [ ] **Step 6: Commit any final fixups**

```bash
git add .
git commit -m "fix(portal): polish access workflow rollout"
```
