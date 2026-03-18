package com.digao.digao_oauth_service.application.dto.authorization;

public record AuditLogResponse(
    Long id,
    String action,
    String targetType,
    String targetId
) {
}
