package com.digao.digao_oauth_service.application.usecases.users;

import java.util.List;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.users.UpdateUserRequest;
import com.digao.digao_oauth_service.application.dto.users.UserResponse;
import com.digao.digao_oauth_service.application.mappers.UserMapper;
import com.digao.digao_oauth_service.core.domain.entities.User;
import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;
import com.digao.digao_oauth_service.helpers.errors.usecase.NoItemsFoundError;

@Service
public class UpdateUserUseCase {
    private final IdentityProviderPort identityProvider;

    public UpdateUserUseCase(IdentityProviderPort identityProvider) {
        this.identityProvider = identityProvider;
    }

    public UserResponse execute(String id, UpdateUserRequest request) {
        identityProvider.getUserById(id)
            .orElseThrow(() -> new NoItemsFoundError("usuario"));

        User user = UserMapper.toDomain(id, request);
        identityProvider.updateUser(user);

        User updated = identityProvider.getUserById(id)
            .orElseThrow(() -> new NoItemsFoundError("usuario"));
        List<String> roles = identityProvider.getUserRoles(id);
        List<String> groups = identityProvider.getUserGroups(id);
        return UserMapper.toResponse(updated, roles, groups);
    }
}
