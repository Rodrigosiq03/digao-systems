package com.digao.digao_oauth_service.application.dto.authorization;

public record CapabilityResponse(
    Long id,
    Long systemId,
    String key,
    String name,
    boolean enabled
) {
}
