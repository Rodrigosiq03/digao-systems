package com.digao.digao_oauth_service.application.dto.authorization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateSystemRequest(
    @NotBlank String name,
    @Size(max = 2048)
    @Pattern(regexp = "https?://.+", message = "Informe uma URL valida.")
    String entryUrl
) {
}
