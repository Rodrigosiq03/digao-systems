package com.digao.digao_oauth_service.application.dto.authorization;

import jakarta.validation.constraints.NotNull;

public record GrantProfileCapabilityRequest(
    @NotNull Long profileId,
    @NotNull Long capabilityId
) {
}
