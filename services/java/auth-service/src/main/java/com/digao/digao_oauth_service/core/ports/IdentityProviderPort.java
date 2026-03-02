package com.digao.digao_oauth_service.core.ports;

import java.util.List;
import java.util.Optional;

import com.digao.digao_oauth_service.core.domain.entities.User;

public interface IdentityProviderPort {
    String createUser(User user, String tempPassword);

    Optional<User> getUserById(String id);
    Optional<User> getUserByEmail(String email);

    List<User> getAllUsers(int page, int limit);
    List<String> getUserRoles(String id);
    List<String> getUserGroups(String id);

    void updateUser(User user);
    void updatePassword(String userId, String newPassword, boolean temporary);
    void triggerResetPasswordAction(String id);
}
