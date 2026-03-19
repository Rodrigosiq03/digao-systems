package com.digao.digao_oauth_service.domain.authorization;

public record UserVpnAccessStateTotal(
    String provider,
    String state,
    long total
) {
}
