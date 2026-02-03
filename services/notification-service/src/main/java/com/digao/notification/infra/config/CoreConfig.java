package com.digao.notification.infra.config;

import com.digao.notification.core.ports.EmailRepository;
import com.digao.notification.core.services.EmailService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CoreConfig {

    @Bean
    public EmailService emailService(EmailRepository emailRepository) {
        return new EmailService(emailRepository);
    }
}