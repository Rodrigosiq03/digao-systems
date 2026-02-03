package com.digao.digao_oauth_service.application.usecases.users;

import java.util.List;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.users.UserResponse;
import com.digao.digao_oauth_service.application.mappers.UserMapper;
import com.digao.digao_oauth_service.core.domain.entities.User;
import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;
import com.digao.digao_oauth_service.helpers.errors.usecase.NoItemsFoundError;

@Service
public class GetUserUseCase {
    private final IdentityProviderPort identityProvider;

    public GetUserUseCase(IdentityProviderPort identityProvider) {
        this.identityProvider = identityProvider;
    }

    public UserResponse execute(String id) {
        User user = identityProvider.getUserById(id)
            .orElseThrow(() -> new NoItemsFoundError("usuario"));

        List<String> roles = identityProvider.getUserRoles(id);
        List<String> groups = identityProvider.getUserGroups(id);

        return UserMapper.toResponse(user, roles, groups);
    }
}
