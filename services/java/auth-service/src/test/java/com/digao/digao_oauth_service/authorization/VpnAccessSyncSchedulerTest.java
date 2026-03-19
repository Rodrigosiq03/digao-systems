package com.digao.digao_oauth_service.authorization;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.digao.digao_oauth_service.application.vpn.UserVpnAccessSyncResult;
import com.digao.digao_oauth_service.application.vpn.UserVpnAccessSyncService;
import com.digao.digao_oauth_service.infra.vpn.VpnAccessSyncScheduler;
import com.digao.digao_oauth_service.infra.vpn.VpnSyncProperties;

@ExtendWith(MockitoExtension.class)
class VpnAccessSyncSchedulerTest {

    @Mock
    private UserVpnAccessSyncService syncService;

    @Test
    void skipsSyncWhenFeatureFlagIsDisabled() {
        VpnAccessSyncScheduler scheduler = new VpnAccessSyncScheduler(
            new VpnSyncProperties(false, "0 */15 * * * *", "tailscale", "https://api.tailscale.com", "", "", 100),
            syncService
        );

        scheduler.run();

        verify(syncService, never()).sync("vpn-sync:tailscale");
    }

    @Test
    void executesSyncWhenFeatureFlagIsEnabled() {
        VpnAccessSyncScheduler scheduler = new VpnAccessSyncScheduler(
            new VpnSyncProperties(true, "0 */15 * * * *", "tailscale", "https://api.tailscale.com", "tailnet.example.ts.net", "token", 100),
            syncService
        );
        when(syncService.sync("vpn-sync:tailscale")).thenReturn(new UserVpnAccessSyncResult(1, 1, 1));

        scheduler.run();

        verify(syncService).sync("vpn-sync:tailscale");
    }
}
