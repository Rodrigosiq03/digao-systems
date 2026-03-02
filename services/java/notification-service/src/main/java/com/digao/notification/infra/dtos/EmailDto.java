package com.digao.notification.infra.dtos;

import com.digao.notification.core.domain.EmailType;

public record EmailDto(
        String traceId,
        EmailType type,
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
