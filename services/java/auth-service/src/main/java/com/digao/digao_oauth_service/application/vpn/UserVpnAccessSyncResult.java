package com.digao.digao_oauth_service.application.vpn;

public record UserVpnAccessSyncResult(
    int totalObservedUsers,
    int totalMatchedUsers,
    int totalUpdatedUsers
) {
    public static UserVpnAccessSyncResult disabled() {
        return new UserVpnAccessSyncResult(0, 0, 0);
    }
}
