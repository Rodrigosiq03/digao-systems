package com.digao.digao_oauth_service.application.dto.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PublicPasswordResetRequest(
    @NotBlank @Email String email
) {
}
