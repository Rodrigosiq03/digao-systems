package com.digao.digao_oauth_service.application.dto.authorization;

import java.time.OffsetDateTime;

public record SystemResponse(
    Long id,
    String key,
    String name,
    String entryUrl,
    boolean enabled,
    OffsetDateTime disabledAt,
    String disabledBy
) {
}
