package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import com.digao.digao_oauth_service.application.metrics.AuthServiceMetrics;

class AuthServiceMetricsTest {

    @Test
    void recordsAuditEventsWithActionAndTargetTags() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        AuthServiceMetrics metrics = new AuthServiceMetrics(registry);

        metrics.recordAuditEvent("system.created", "system");
        metrics.recordAuditEvent("system.created", "system");
        metrics.recordAuditEvent("profile.disabled", "profile");

        assertEquals(2.0d, registry.find("digao_auth_audit_events_total")
            .tag("action", "system.created")
            .tag("target_type", "system")
            .counter()
            .count());
        assertEquals(1.0d, registry.find("digao_auth_audit_events_total")
            .tag("action", "profile.disabled")
            .tag("target_type", "profile")
            .counter()
            .count());
    }

    @Test
    void recordsVpnSyncRunAndSummaryMetrics() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        AuthServiceMetrics metrics = new AuthServiceMetrics(registry);

        metrics.recordVpnSyncRun("tailscale", "success");
        metrics.recordVpnSyncObservedUsers("tailscale", 3);
        metrics.recordVpnSyncMatchedUsers("tailscale", 2);
        metrics.recordVpnSyncUpdatedUsers("tailscale", 1);

        assertEquals(1.0d, registry.find("digao_auth_vpn_sync_runs_total")
            .tag("provider", "tailscale")
            .tag("status", "success")
            .counter()
            .count());
        assertEquals(3.0d, registry.find("digao_auth_vpn_sync_observed_users_total")
            .tag("provider", "tailscale")
            .counter()
            .count());
        assertEquals(2.0d, registry.find("digao_auth_vpn_sync_matched_users_total")
            .tag("provider", "tailscale")
            .counter()
            .count());
        assertEquals(1.0d, registry.find("digao_auth_vpn_sync_updated_users_total")
            .tag("provider", "tailscale")
            .counter()
            .count());
    }
}
