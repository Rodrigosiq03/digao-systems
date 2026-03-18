package com.digao.digao_oauth_service.application.dto.authorization;

public record ProfileCapabilityResponse(
    Long id,
    Long profileId,
    String profileKey,
    Long capabilityId,
    String capabilityKey
) {
}
