package com.digao.notification.core.ports;

import com.digao.notification.core.domain.Email;

public interface EmailRepository {
    void sendEmail(Email email);
}
