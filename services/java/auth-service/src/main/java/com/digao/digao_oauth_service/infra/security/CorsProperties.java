package com.digao.digao_oauth_service.infra.security;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "digao.cors")
public record CorsProperties(
    List<String> allowedOrigins
) {
}
