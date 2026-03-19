package com.digao.digao_oauth_service.application.dto.authorization;

import java.time.OffsetDateTime;

public record AuditLogResponse(
    Long id,
    String action,
    String targetType,
    String targetId,
    String actorEmail,
    OffsetDateTime createdAt
) {
}
