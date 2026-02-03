package com.digao.digao_oauth_service.application.dto.users;

import java.util.List;

public record UserResponse(
    String id,
    String username,
    String email,
    String firstName,
    String lastName,
    String fullName,
    String role,
    boolean enabled,
    List<String> roles,
    List<String> groups
) {
}
