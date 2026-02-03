package com.digao.digao_oauth_service.core.domain.entities;

public record Tokens(
    String accessToken,
    String refreshToken,
    Long expiresIn
) {}
