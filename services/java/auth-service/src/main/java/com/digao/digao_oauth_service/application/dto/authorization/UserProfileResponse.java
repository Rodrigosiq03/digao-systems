package com.digao.digao_oauth_service.application.dto.authorization;

public record UserProfileResponse(
    Long id,
    String keycloakUserId,
    Long profileId,
    String profileKey
) {
}
