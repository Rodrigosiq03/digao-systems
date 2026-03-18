package com.digao.digao_oauth_service.application.dto.authorization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCapabilityRequest(
    @NotNull Long systemId,
    @NotBlank String key,
    @NotBlank String name
) {
}
