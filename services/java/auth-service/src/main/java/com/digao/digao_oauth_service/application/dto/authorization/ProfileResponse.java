package com.digao.digao_oauth_service.application.dto.authorization;

public record ProfileResponse(
    Long id,
    String key,
    String name,
    boolean enabled
) {
}
