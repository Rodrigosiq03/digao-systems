package com.digao.digao_oauth_service.application.usecases.users;

import java.util.List;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.users.CreateUserRequest;
import com.digao.digao_oauth_service.application.dto.users.UserResponse;
import com.digao.digao_oauth_service.application.mappers.UserMapper;
import com.digao.digao_oauth_service.core.domain.entities.User;
import java.security.SecureRandom;

import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;
import com.digao.digao_oauth_service.core.ports.NotificationPort;

@Service
public class CreateUserUseCase {
    private final IdentityProviderPort identityProvider;
    private final NotificationPort notificationPort;

    public CreateUserUseCase(IdentityProviderPort identityProvider, NotificationPort notificationPort) {
        this.identityProvider = identityProvider;
        this.notificationPort = notificationPort;
    }

    public UserResponse execute(CreateUserRequest request) {
        User user = UserMapper.toDomain(request);
        String tempPassword = generateTempPassword();
        String userId = identityProvider.createUser(user, tempPassword);

        User baseUser = identityProvider.getUserById(userId)
            .orElseThrow(() -> new IllegalStateException("Usuário criado, mas não encontrado no Keycloak."));

        List<String> roles = identityProvider.getUserRoles(userId);
        List<String> groups = identityProvider.getUserGroups(userId);

        notificationPort.sendFirstAccessEmail(
            baseUser.getEmail(),
            baseUser.getFirstName() + " " + baseUser.getLastName(),
            baseUser.getUsername(),
            tempPassword
        );

        return UserMapper.toResponse(baseUser, roles, groups);
    }

    private String generateTempPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnopqrstuvwxyz";
        String digits = "23456789";
        String symbols = "!@#$%&*";
        String all = upper + lower + digits + symbols;
        SecureRandom random = new SecureRandom();
        StringBuilder builder = new StringBuilder();
        builder.append(upper.charAt(random.nextInt(upper.length())));
        builder.append(lower.charAt(random.nextInt(lower.length())));
        builder.append(digits.charAt(random.nextInt(digits.length())));
        builder.append(symbols.charAt(random.nextInt(symbols.length())));
        for (int i = 0; i < 6; i++) {
            builder.append(all.charAt(random.nextInt(all.length())));
        }
        return builder.toString();
    }
}
