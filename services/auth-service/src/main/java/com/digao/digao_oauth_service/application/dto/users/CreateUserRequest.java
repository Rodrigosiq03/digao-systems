package com.digao.digao_oauth_service.application.dto.users;

import com.digao.digao_oauth_service.core.domain.enums.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
    @NotBlank String username,
    @NotBlank @Email String email,
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotNull UserRole role,
    @NotNull Boolean enabled
) {
}
