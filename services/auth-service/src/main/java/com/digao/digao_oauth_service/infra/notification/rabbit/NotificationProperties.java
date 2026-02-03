package com.digao.digao_oauth_service.infra.notification.rabbit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "digao.notification")
public record NotificationProperties(
    String loginUrl
) {
}
