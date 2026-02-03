package com.digao.notification.core.services;

import com.digao.notification.core.domain.Email;
import com.digao.notification.core.domain.EmailType;
import com.digao.notification.core.ports.EmailRepository;

public class EmailService {
    private final EmailRepository repository;

    public EmailService(EmailRepository repository) {
        this.repository = repository;
    }

    public void sendEmail(
            EmailType type,
            String to,
            String fullName,
            String username,
            String temporaryPassword,
            String resetLink,
            String expiresIn,
            String subject,
            String body,
            String loginUrl
    ) {
        EmailType resolvedType = type != null ? type : EmailType.FIRST_ACCESS;
        String resolvedSubject = resolveSubject(resolvedType, subject);
        String resolvedBody = resolveBody(resolvedType, body);
        var email = new Email(
                to,
                resolvedType,
                resolvedSubject,
                resolvedBody,
                fullName,
                username,
                temporaryPassword,
                resetLink,
                expiresIn,
                loginUrl
        );

        repository.sendEmail(email);
    }

    private String resolveSubject(EmailType type, String subject) {
        if (subject != null && !subject.isBlank()) {
            return subject;
        }
        return switch (type) {
            case FIRST_ACCESS -> "Bem-vindo ao Digão OAuth";
            case RESET_PASSWORD -> "Redefinição de senha";
        };
    }

    private String resolveBody(EmailType type, String body) {
        if (body != null && !body.isBlank()) {
            return body;
        }
        return null;
    }
}
