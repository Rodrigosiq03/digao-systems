package com.digao.digao_oauth_service.application.dto.authorization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record CreateSystemRequest(
    @NotBlank String key,
    @NotBlank String name,
    @Size(max = 2048)
    @Pattern(regexp = "https?://.+", message = "Informe uma URL valida.")
    String entryUrl
) {
}
