package com.digao.digao_oauth_service.infra.vpn;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "digao.vpn-sync")
public record VpnSyncProperties(
    boolean enabled,
    String cron,
    String provider,
    String apiBaseUrl,
    String tailnet,
    String apiToken,
    int userPageSize
) {
    public VpnSyncProperties {
        cron = cron == null || cron.isBlank() ? "0 */15 * * * *" : cron;
        provider = provider == null || provider.isBlank() ? "tailscale" : provider;
        apiBaseUrl = apiBaseUrl == null || apiBaseUrl.isBlank() ? "https://api.tailscale.com" : apiBaseUrl;
        userPageSize = userPageSize <= 0 ? 200 : userPageSize;
    }
}
