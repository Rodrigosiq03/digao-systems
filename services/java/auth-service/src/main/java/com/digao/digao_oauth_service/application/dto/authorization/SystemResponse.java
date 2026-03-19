package com.digao.digao_oauth_service.application.dto.authorization;

public record SystemResponse(
    Long id,
    String key,
    String name,
    String entryUrl,
    boolean enabled
) {
}
