package com.digao.digao_oauth_service.infra.notification.rabbit;

public record EmailPayload(
    String traceId,
    String type,
    String to,
    String fullName,
    String resetLink,
    String expiresIn,
    String subject,
    String body,
    String username,
    String temporaryPassword,
    String loginUrl
) {
}
