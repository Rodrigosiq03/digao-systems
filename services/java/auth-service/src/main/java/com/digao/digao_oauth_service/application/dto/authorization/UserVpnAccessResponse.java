package com.digao.digao_oauth_service.application.dto.authorization;

import java.time.OffsetDateTime;

public record UserVpnAccessResponse(
    String keycloakUserId,
    String provider,
    String status,
    String inviteLink,
    String notes,
    OffsetDateTime invitedAt,
    OffsetDateTime activatedAt,
    OffsetDateTime revokedAt
) {
}
