package com.digao.digao_oauth_service.application.dto.authorization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AssignUserProfileRequest(
    @NotBlank String keycloakUserId,
    @NotNull Long profileId
) {
}
