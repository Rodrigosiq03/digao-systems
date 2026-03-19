# Portal VPN Provider Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add provider-driven VPN reconciliation to the auth-service so portal VPN access records can be promoted from external observation, matched by email, and controlled by feature flag.

**Architecture:** Evolve `user_vpn_access` to a single effective `state` plus provider observation fields, add a provider adapter and reconciliation service inside the auth-service, and trigger periodic sync through a Spring scheduler guarded by config flags. Keep provider-specific logic behind a small adapter boundary and avoid automatic revocation on missing observations.

**Tech Stack:** Spring Boot 4, Spring Scheduling, Spring Data JPA, Flyway, PostgreSQL, existing auth-service test stack.

---

## File Structure

- Modify: `services/java/auth-service/src/main/resources/db/migration/`
  - add migration to evolve `user_vpn_access`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/UserVpnAccessEntity.java`
  - replace old fields with final state + provider observation fields
- Modify/Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/`
  - repository queries needed by sync
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/vpn/`
  - sync and reconciliation services
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/vpn/`
  - provider adapter abstractions and Tailscale client
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/scheduling/VpnAccessSyncScheduler.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/config/VpnSyncProperties.java`
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/`
  - schema, repository and service tests
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/vpn/`
  - sync and scheduler tests

## Chunk 1: Evolve the VPN Access Schema

### Task 1: Add failing schema test for final VPN access columns

**Files:**
- Modify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationSchemaSmokeTest.java`
- Modify/Create: `services/java/auth-service/src/main/resources/db/migration/`

- [ ] **Step 1: Write the failing schema assertion**

Extend the schema smoke test to require these columns in `user_vpn_access`:
- `state`
- `provider_role`
- `provider_last_seen_at`
- `provider_observed_at`

And to stop expecting the legacy `status`-only shape.

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationSchemaSmokeTest test`
Expected: FAIL because the current migration/entity still use the old model.

- [ ] **Step 3: Add migration for schema evolution**

Create a new Flyway migration that:
- renames or migrates `status` to `state`
- adds `provider_role`
- adds `provider_last_seen_at`
- adds `provider_observed_at`
- keeps the existing primary key `(keycloak_user_id, provider)`

- [ ] **Step 4: Run schema test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationSchemaSmokeTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/resources/db/migration services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationSchemaSmokeTest.java
git commit -m "feat(auth): evolve vpn access schema for provider sync"
```

### Task 2: Add failing repository test for provider observation persistence

**Files:**
- Modify/Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationRepositoryTest.java`
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/UserVpnAccessEntity.java`

- [ ] **Step 1: Write the failing repository test**

Persist a `user_vpn_access` row and assert the entity round-trips:
- `state`
- `provider_role`
- `provider_last_seen_at`
- `provider_observed_at`

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationRepositoryTest test`
Expected: FAIL because the entity does not yet support the final fields.

- [ ] **Step 3: Update entity and repository model**

Implement the final field set and keep lifecycle helpers focused on the single effective `state`.

- [ ] **Step 4: Run repository test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationRepositoryTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/domain/authorization/UserVpnAccessEntity.java services/java/auth-service/src/test/java/com/digao/digao_oauth_service/authorization/AuthorizationRepositoryTest.java
git commit -m "feat(auth): persist provider observation fields for vpn access"
```

## Chunk 2: Add Provider Adapter and Reconciliation Logic

### Task 3: Add failing service test for email-based reconciliation

**Files:**
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/vpn/UserVpnAccessReconciliationServiceTest.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/vpn/UserVpnAccessReconciliationService.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/vpn/VpnObservedUser.java`

- [ ] **Step 1: Write the failing reconciliation test**

Cover:
- match by email
- when observed active, promote `state` to `active`
- update `provider_role`
- set `provider_observed_at`
- do not downgrade state when user is missing from provider response

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=UserVpnAccessReconciliationServiceTest test`
Expected: FAIL because the reconciliation service does not exist.

- [ ] **Step 3: Implement minimal reconciliation service**

Keep rules conservative:
- promote to `active` when observed active
- never auto-revoke on missing result

- [ ] **Step 4: Run test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=UserVpnAccessReconciliationServiceTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/vpn services/java/auth-service/src/test/java/com/digao/digao_oauth_service/vpn/UserVpnAccessReconciliationServiceTest.java
git commit -m "feat(auth): add vpn access reconciliation service"
```

### Task 4: Add failing adapter test for provider client boundary

**Files:**
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/vpn/TailscaleVpnProviderClientTest.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/vpn/VpnProviderClient.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/vpn/TailscaleVpnProviderClient.java`

- [ ] **Step 1: Write the failing adapter test**

Assert that the provider adapter maps external response fields into the neutral model:
- `email`
- `role`
- `lastSeenAt`
- `active`

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=TailscaleVpnProviderClientTest test`
Expected: FAIL because the provider adapter does not exist.

- [ ] **Step 3: Implement provider boundary**

Create a small provider interface and a Tailscale implementation. Keep HTTP/client details inside the adapter only.

- [ ] **Step 4: Run test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=TailscaleVpnProviderClientTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/vpn services/java/auth-service/src/test/java/com/digao/digao_oauth_service/vpn/TailscaleVpnProviderClientTest.java
git commit -m "feat(auth): add vpn provider adapter"
```

## Chunk 3: Add Scheduler and Feature Flags

### Task 5: Add failing scheduler/config test for feature-flagged sync

**Files:**
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/vpn/VpnAccessSyncSchedulerTest.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/config/VpnSyncProperties.java`
- Create: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/scheduling/VpnAccessSyncScheduler.java`
- Create/Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/vpn/UserVpnAccessSyncService.java`

- [ ] **Step 1: Write the failing scheduler test**

Cover:
- when `enabled=false`, sync service is not called
- when `enabled=true`, sync service is called once

- [ ] **Step 2: Run test to verify it fails**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=VpnAccessSyncSchedulerTest test`
Expected: FAIL because properties/scheduler do not exist.

- [ ] **Step 3: Implement scheduler and config**

Add:
- `digao.vpn-sync.enabled`
- `digao.vpn-sync.cron`
- provider token/config placeholders

Keep the scheduler thin and delegate to `UserVpnAccessSyncService`.

- [ ] **Step 4: Run test to verify it passes**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=VpnAccessSyncSchedulerTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/config/VpnSyncProperties.java services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/scheduling/VpnAccessSyncScheduler.java services/java/auth-service/src/main/java/com/digao/digao_oauth_service/application/vpn/UserVpnAccessSyncService.java services/java/auth-service/src/test/java/com/digao/digao_oauth_service/vpn/VpnAccessSyncSchedulerTest.java
git commit -m "feat(auth): add feature-flagged vpn sync scheduler"
```

## Chunk 4: Final Verification

### Task 6: Run focused auth-service verification

**Files:**
- Verify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/`
- Verify: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/`

- [ ] **Step 1: Run backend tests**

Run: `./services/java/auth-service/mvnw -f services/java/auth-service/pom.xml -Dtest=AuthorizationSchemaSmokeTest,AuthorizationRepositoryTest,UserVpnAccessReconciliationServiceTest,TailscaleVpnProviderClientTest,VpnAccessSyncSchedulerTest test`
Expected: PASS.

- [ ] **Step 2: Run diff verification**

Run: `git diff --check`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add services/java/auth-service
git commit -m "feat(auth): add provider-driven vpn access sync"
```
