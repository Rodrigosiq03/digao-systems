package com.digao.digao_oauth_service.application.dto.authorization;

import java.util.List;

public record MyAccessResponse(
    List<String> portalRoles,
    List<AccessProfileResponse> profiles,
    List<AccessSystemResponse> systems
) {
}
