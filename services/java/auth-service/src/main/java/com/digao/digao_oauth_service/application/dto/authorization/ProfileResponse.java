package com.digao.digao_oauth_service.application.dto.authorization;

import java.time.OffsetDateTime;

public record ProfileResponse(
    Long id,
    String key,
    String name,
    boolean enabled,
    OffsetDateTime disabledAt,
    String disabledBy
) {
}
