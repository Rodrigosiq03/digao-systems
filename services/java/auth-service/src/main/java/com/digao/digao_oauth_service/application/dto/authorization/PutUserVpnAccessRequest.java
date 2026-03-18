package com.digao.digao_oauth_service.application.dto.authorization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PutUserVpnAccessRequest(
    @NotBlank
    @Pattern(regexp = "none|invite_pending|active|revoked")
    String status,

    @Size(max = 2000)
    String inviteLink,

    @Size(max = 4000)
    String notes
) {
}
