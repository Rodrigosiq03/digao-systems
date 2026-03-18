package com.digao.digao_oauth_service.application.dto.authorization;

import jakarta.validation.constraints.NotBlank;

public record CreateProfileRequest(
    @NotBlank String key,
    @NotBlank String name
) {
}
