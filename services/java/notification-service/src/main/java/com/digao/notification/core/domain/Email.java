package com.digao.notification.core.domain;

import java.util.regex.Pattern;

public record Email(
        String to,
        EmailType type,
        String subject,
        String body,
        String fullName,
        String username,
        String temporaryPassword,
        String resetLink,
        String expiresIn,
        String loginUrl
) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    public Email {
        if (to == null || !EMAIL_PATTERN.matcher(to).matches()) {
            throw new IllegalArgumentException("Endereço de e-mail inválido: " + to);
        }
        if (type == null) {
            throw new IllegalArgumentException("Tipo de e-mail não pode ser nulo");
        }
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("O assunto não pode ser vazio");
        }
        if (type == EmailType.RESET_PASSWORD) {
            if (resetLink == null || resetLink.isBlank()) {
                throw new IllegalArgumentException("O link de redefinição não pode ser vazio");
            }
            if (expiresIn == null || expiresIn.isBlank()) {
                throw new IllegalArgumentException("O tempo de expiração não pode ser vazio");
            }
        }
        if (type == EmailType.FIRST_ACCESS) {
            if (temporaryPassword == null || temporaryPassword.isBlank()) {
                throw new IllegalArgumentException("A senha temporária não pode ser vazia");
            }
            if (loginUrl == null || loginUrl.isBlank()) {
                throw new IllegalArgumentException("O link de acesso não pode ser vazio");
            }
            if (username == null || username.isBlank()) {
                throw new IllegalArgumentException("O usuário não pode ser vazio");
            }
        }
    }
}
