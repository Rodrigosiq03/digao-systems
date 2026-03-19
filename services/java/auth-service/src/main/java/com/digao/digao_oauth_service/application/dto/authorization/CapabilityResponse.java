package com.digao.digao_oauth_service.application.dto.authorization;

import java.time.OffsetDateTime;

public record CapabilityResponse(
    Long id,
    Long systemId,
    String key,
    String name,
    boolean enabled,
    OffsetDateTime disabledAt,
    String disabledBy
) {
}
