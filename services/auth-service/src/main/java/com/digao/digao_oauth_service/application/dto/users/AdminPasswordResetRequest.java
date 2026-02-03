package com.digao.digao_oauth_service.application.dto.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdminPasswordResetRequest(
    @NotBlank String newPassword,
    @NotNull Boolean temporary
) {
}
