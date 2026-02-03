package com.digao.digao_oauth_service.infra.notification.rabbit;

import java.util.UUID;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import com.digao.digao_oauth_service.core.ports.NotificationPort;

@Component
public class RabbitNotificationAdapter implements NotificationPort {
    private final RabbitTemplate rabbitTemplate;
    private final RabbitNotificationProperties rabbitProperties;
    private final NotificationProperties notificationProperties;

    public RabbitNotificationAdapter(
        RabbitTemplate rabbitTemplate,
        RabbitNotificationProperties rabbitProperties,
        NotificationProperties notificationProperties
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.rabbitProperties = rabbitProperties;
        this.notificationProperties = notificationProperties;
    }

    @Override
    public void sendFirstAccessEmail(String email, String fullName, String username, String tempPassword) {
        String loginUrl = notificationProperties.loginUrl();
        if (loginUrl == null || loginUrl.isBlank()) {
            throw new IllegalStateException("loginUrl não configurado para envio de e-mail.");
        }
        EmailPayload payload = new EmailPayload(
            UUID.randomUUID().toString(),
            "FIRST_ACCESS",
            email,
            fullName,
            null,
            null,
            null,
            null,
            username,
            tempPassword,
            loginUrl
        );
        publish(payload);
    }

    @Override
    public void sendResetPasswordLink(String email, String resetLink) {
        EmailPayload payload = new EmailPayload(
            UUID.randomUUID().toString(),
            "RESET_PASSWORD",
            email,
            null,
            resetLink,
            null,
            null,
            null,
            null,
            null,
            null
        );
        publish(payload);
    }

    private void publish(EmailPayload payload) {
        rabbitTemplate.convertAndSend(rabbitProperties.exchange(), rabbitProperties.routingKey(), payload);
    }
}
