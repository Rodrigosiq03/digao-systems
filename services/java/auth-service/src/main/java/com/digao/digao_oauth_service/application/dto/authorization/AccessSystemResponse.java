package com.digao.digao_oauth_service.application.dto.authorization;

import java.util.List;

public record AccessSystemResponse(
    Long id,
    String key,
    String name,
    List<String> capabilities
) {
}
