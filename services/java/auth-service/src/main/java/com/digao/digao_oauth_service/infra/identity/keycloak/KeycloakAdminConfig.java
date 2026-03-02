package com.digao.digao_oauth_service.infra.identity.keycloak;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(KeycloakAdminProperties.class)
public class KeycloakAdminConfig {

    @Bean
    Keycloak keycloakAdmin(KeycloakAdminProperties properties) {
        return KeycloakBuilder.builder()
            .serverUrl(properties.serverUrl())
            .realm(properties.realm())
            .clientId(properties.clientId())
            .clientSecret(properties.clientSecret())
            .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
            .build();
    }
}
