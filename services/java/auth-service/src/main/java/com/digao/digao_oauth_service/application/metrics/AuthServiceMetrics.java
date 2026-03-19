package com.digao.digao_oauth_service.application.metrics;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;

@Component
public class AuthServiceMetrics {

    private final MeterRegistry meterRegistry;
    private final ConcurrentMap<String, AtomicInteger> vpnAccessTotals = new ConcurrentHashMap<>();

    public AuthServiceMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void recordAuditEvent(String action, String targetType) {
        meterRegistry.counter(
            "digao_auth_audit_events_total",
            "action",
            action,
            "target_type",
            targetType
        ).increment();
    }

    public void recordVpnSyncRun(String provider, String status) {
        meterRegistry.counter(
            "digao_auth_vpn_sync_runs_total",
            "provider",
            provider,
            "status",
            status
        ).increment();
    }

    public void recordVpnSyncObservedUsers(String provider, int count) {
        meterRegistry.counter(
            "digao_auth_vpn_sync_observed_users_total",
            "provider",
            provider
        ).increment(Math.max(0, count));
    }

    public void recordVpnSyncMatchedUsers(String provider, int count) {
        meterRegistry.counter(
            "digao_auth_vpn_sync_matched_users_total",
            "provider",
            provider
        ).increment(Math.max(0, count));
    }

    public void recordVpnSyncUpdatedUsers(String provider, int count) {
        meterRegistry.counter(
            "digao_auth_vpn_sync_updated_users_total",
            "provider",
            provider
        ).increment(Math.max(0, count));
    }

    public void setUserVpnAccessTotal(String provider, String state, int total) {
        String key = provider + "|" + state;
        AtomicInteger gauge = vpnAccessTotals.computeIfAbsent(key, ignored ->
            meterRegistry.gauge(
                "digao_auth_user_vpn_access_total",
                Tags.of("provider", provider, "state", state),
                new AtomicInteger(0)
            )
        );
        gauge.set(Math.max(0, total));
    }
}
