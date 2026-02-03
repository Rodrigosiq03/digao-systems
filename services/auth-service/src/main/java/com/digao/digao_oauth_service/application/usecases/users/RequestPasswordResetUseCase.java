package com.digao.digao_oauth_service.application.usecases.users;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.users.PublicPasswordResetRequest;
import com.digao.digao_oauth_service.core.domain.entities.User;
import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;

@Service
public class RequestPasswordResetUseCase {
    private final IdentityProviderPort identityProvider;

    public RequestPasswordResetUseCase(IdentityProviderPort identityProvider) {
        this.identityProvider = identityProvider;
    }

    public void execute(PublicPasswordResetRequest request) {
        identityProvider.getUserByEmail(request.email())
            .ifPresent(user -> identityProvider.triggerResetPasswordAction(user.getId().toString()));
    }
}
