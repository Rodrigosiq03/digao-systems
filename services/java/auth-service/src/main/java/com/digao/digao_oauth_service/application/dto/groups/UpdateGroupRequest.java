package com.digao.digao_oauth_service.application.dto.groups;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateGroupRequest(
    @NotBlank String name,
    @NotNull Map<String, List<String>> attributes
) {
}
