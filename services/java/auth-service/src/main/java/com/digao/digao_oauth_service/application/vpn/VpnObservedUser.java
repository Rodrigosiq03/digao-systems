package com.digao.digao_oauth_service.application.vpn;

import java.time.OffsetDateTime;

public record VpnObservedUser(
    String email,
    String role,
    OffsetDateTime lastSeenAt,
    OffsetDateTime observedAt,
    boolean active
) {
}
