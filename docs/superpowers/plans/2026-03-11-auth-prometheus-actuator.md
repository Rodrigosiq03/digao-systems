# Auth Prometheus Actuator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the auth-service expose `/actuator/prometheus` without authentication so Prometheus can scrape it in dev.

**Architecture:** Add a focused security regression test around the auth-service web layer and then make the minimal `SecurityConfig` change to permit the actuator endpoints needed for metrics and basic health visibility. Keep the rest of the resource server behavior unchanged.

**Tech Stack:** Spring Boot, Spring Security, MockMvc, JUnit 5, Maven Wrapper.

---

## Chunk 1: Security regression coverage

### Task 1: Add actuator access test

**Files:**
- Create: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/infra/security/SecurityConfigActuatorTest.java`
- Reference: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/security/SecurityConfig.java`
- Reference: `services/java/auth-service/src/main/resources/application.yaml`

- [ ] Write a MockMvc-based test asserting `/actuator/prometheus` does not return `401`.
- [ ] Run the targeted test and confirm it fails for the expected reason.

## Chunk 2: Minimal security change

### Task 2: Permit actuator endpoints needed for observability

**Files:**
- Modify: `services/java/auth-service/src/main/java/com/digao/digao_oauth_service/infra/security/SecurityConfig.java`
- Test: `services/java/auth-service/src/test/java/com/digao/digao_oauth_service/infra/security/SecurityConfigActuatorTest.java`

- [ ] Permit `/actuator/health`, `/actuator/info`, and `/actuator/prometheus` in the security chain.
- [ ] Re-run the targeted test and confirm it passes.
- [ ] Run the auth-service test suite or a focused smoke set to ensure no regression.

## Chunk 3: Publish hotfix

### Task 3: Commit and push

**Files:**
- Commit: updated security config and test

- [ ] Review the diff.
- [ ] Commit with a focused message.
- [ ] Push branch for manual merge and GitHub Actions deployment.
