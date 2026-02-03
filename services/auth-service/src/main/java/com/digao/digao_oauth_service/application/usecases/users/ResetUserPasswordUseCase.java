package com.digao.digao_oauth_service.application.usecases.users;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.users.AdminPasswordResetRequest;
import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;
import com.digao.digao_oauth_service.helpers.errors.usecase.NoItemsFoundError;

@Service
public class ResetUserPasswordUseCase {
    private final IdentityProviderPort identityProvider;

    public ResetUserPasswordUseCase(IdentityProviderPort identityProvider) {
        this.identityProvider = identityProvider;
    }

    public void execute(String id, AdminPasswordResetRequest request) {
        identityProvider.getUserById(id)
            .orElseThrow(() -> new NoItemsFoundError("usuario"));

        identityProvider.updatePassword(id, request.newPassword(), request.temporary());
    }
}
