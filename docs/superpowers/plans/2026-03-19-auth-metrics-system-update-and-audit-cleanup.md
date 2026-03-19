# Auth Metrics, System Update, And Audit Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable system metadata, logical-disable timestamps, meaningful Prometheus metrics, historical VPN audit cleanup, and automatic landing-page redirect on expired sessions.

**Architecture:** Extend the existing authorization domain rather than adding parallel models. The backend owns update semantics, logical disable metadata, audit cleanup, and Micrometer instrumentation; the portal reuses the current system form and protected API client to surface the new behavior.

**Tech Stack:** Spring Boot, Spring Security, JPA/Hibernate, Flyway, Micrometer/Prometheus, React, TanStack Query, Zustand, Zod, React Hook Form, Tailwind CSS

---

## Chunk 1: Backend Domain And API

### Task 1: Add failing tests for system update and disable metadata

**Files:**
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AdminAuthorizationControllerTest.java`
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationServiceTest.java`

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Run `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest,AuthorizationServiceTest test` and verify failure**
- [ ] **Step 3: Add Flyway migration for `disabled_at` and `disabled_by` on `systems`, `profiles`, and `capabilities`**
- [ ] **Step 4: Extend entities and responses to expose disable metadata**
- [ ] **Step 5: Add `PUT /admin/systems/{id}` to update `name` and `entryUrl` only**
- [ ] **Step 6: Record `system.updated` audit events**
- [ ] **Step 7: Re-run the focused backend tests and verify pass**
- [ ] **Step 8: Commit backend domain/API chunk**

### Task 2: Add failing tests for Prometheus metrics and VPN sync counters

**Files:**
- Create or Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthMetricsTest.java`
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/UserVpnAccessSyncServiceTest.java`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/authorization/AuditLogService.java`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/vpn/UserVpnAccessSyncService.java`

- [ ] **Step 1: Write failing tests for Micrometer counters and gauge exposure**
- [ ] **Step 2: Run the focused tests and verify failure**
- [ ] **Step 3: Add shared metrics recorder/service using `MeterRegistry`**
- [ ] **Step 4: Instrument audit event recording**
- [ ] **Step 5: Instrument VPN sync runs, observed users, matched users, updated users, and current VPN state totals**
- [ ] **Step 6: Re-run the focused tests and verify pass**
- [ ] **Step 7: Commit metrics chunk**

### Task 3: Add audit cleanup for historical `provider_synced` noise

**Files:**
- Create: `services/java/auth-service/src/main/resources/db/migration/V*_cleanup_noisy_vpn_sync_audit_logs.sql`
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationSchemaSmokeTest.java`

- [ ] **Step 1: Write a migration-oriented test expectation for the cleanup**
- [ ] **Step 2: Run the migration-focused test and verify failure**
- [ ] **Step 3: Add a data-fix migration that removes redundant `user_vpn_access.provider_synced` rows while preserving the useful activation history**
- [ ] **Step 4: Re-run migration-focused verification**
- [ ] **Step 5: Commit audit cleanup chunk**

## Chunk 2: Portal UX And Session Behavior

### Task 4: Add failing tests for system edit flow

**Files:**
- Modify: `clients/web/digao-oauth-portal/tests/test_authorization_mutations_contract.py`
- Modify: `clients/web/digao-oauth-portal/tests/test_authorization_api_contract.py`
- Modify: `clients/web/digao-oauth-portal/src/application/authorization/authorizationPort.ts`
- Modify: `clients/web/digao-oauth-portal/src/infrastructure/authorization/authorizationApiClient.ts`
- Modify: `clients/web/digao-oauth-portal/src/presentation/forms/systemForm.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/SystemsPage.tsx`

- [ ] **Step 1: Write failing portal contracts for `updateSystem` and editable system sheet behavior**
- [ ] **Step 2: Run the portal contracts and verify failure**
- [ ] **Step 3: Extend the authorization client/port with `updateSystem`**
- [ ] **Step 4: Refactor `SystemForm` to support both create and update modes**
- [ ] **Step 5: Add `Editar sistema` quick action and wire the edit sheet**
- [ ] **Step 6: Re-run the portal contracts and verify pass**
- [ ] **Step 7: Commit portal system-edit chunk**

### Task 5: Add failing tests for session expiry redirect

**Files:**
- Modify: `clients/web/digao-oauth-portal/tests/test_auth_session_contract.py`
- Modify: `clients/web/digao-oauth-portal/src/infrastructure/http/protectedApiClient.ts`
- Modify: `clients/web/digao-oauth-portal/src/presentation/stores/authStore.ts`

- [ ] **Step 1: Write failing contract asserting redirect to the public landing page on terminal refresh failure**
- [ ] **Step 2: Run the contract and verify failure**
- [ ] **Step 3: Update the protected client/auth store to clear auth state and return to the public landing page automatically**
- [ ] **Step 4: Re-run the session contract and verify pass**
- [ ] **Step 5: Commit session-expiry chunk**

## Chunk 3: Final Verification

### Task 6: Run end-to-end verification for the package

**Files:**
- Verify only

- [ ] **Step 1: Run `python3 -m unittest clients/web/digao-oauth-portal/tests/test_authorization_api_contract.py clients/web/digao-oauth-portal/tests/test_authorization_mutations_contract.py clients/web/digao-oauth-portal/tests/test_auth_session_contract.py clients/web/digao-oauth-portal/tests/test_status_visual_contract.py -v`**
- [ ] **Step 2: Run `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd /data/apps/worktrees/runner-fleet-routing/clients/web/digao-oauth-portal typecheck`**
- [ ] **Step 3: Run `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd /data/apps/worktrees/runner-fleet-routing/clients/web/digao-oauth-portal build`**
- [ ] **Step 4: Run `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AdminAuthorizationControllerTest,AuthorizationServiceTest,UserVpnAccessSyncServiceTest,AuthorizationSchemaSmokeTest,AuthMetricsTest test`**
- [ ] **Step 5: Run `git -C /data/apps/worktrees/runner-fleet-routing diff --check`**
- [ ] **Step 6: Commit the final integration pass if additional fixes were needed**
