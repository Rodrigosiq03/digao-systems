package com.digao.digao_oauth_service.core.ports;

public interface NotificationPort {
    void sendFirstAccessEmail(String email, String fullName, String username, String tempPassword);
    void sendResetPasswordLink(String email, String resetLink);
}
