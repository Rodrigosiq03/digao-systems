package com.digao.digao_oauth_service.infra.vpn;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.digao.digao_oauth_service.application.vpn.UserVpnAccessSyncResult;
import com.digao.digao_oauth_service.application.vpn.UserVpnAccessSyncService;

@Component
public class VpnAccessSyncScheduler {
    private static final Logger logger = LoggerFactory.getLogger(VpnAccessSyncScheduler.class);

    private final VpnSyncProperties properties;
    private final UserVpnAccessSyncService syncService;

    public VpnAccessSyncScheduler(VpnSyncProperties properties, UserVpnAccessSyncService syncService) {
        this.properties = properties;
        this.syncService = syncService;
    }

    @Scheduled(cron = "${digao.vpn-sync.cron:0 */15 * * * *}")
    public void run() {
        if (!properties.enabled()) {
            return;
        }

        String actor = "vpn-sync:" + properties.provider();
        UserVpnAccessSyncResult result = syncService.sync(actor);
        logger.info(
            "VPN provider sync finished provider={} observed={} matched={} updated={}",
            properties.provider(),
            result.totalObservedUsers(),
            result.totalMatchedUsers(),
            result.totalUpdatedUsers()
        );
    }
}
