package com.digao.digao_oauth_service.application.usecases.users;

import java.util.List;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.users.UserResponse;
import com.digao.digao_oauth_service.application.mappers.UserMapper;
import com.digao.digao_oauth_service.core.domain.entities.User;
import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;

@Service
public class ListUsersUseCase {
    private final IdentityProviderPort identityProvider;

    public ListUsersUseCase(IdentityProviderPort identityProvider) {
        this.identityProvider = identityProvider;
    }

    public List<UserResponse> execute(int page, int limit) {
        return identityProvider.getAllUsers(page, limit).stream()
            .map(user -> {
                String id = user.getId() != null ? user.getId().toString() : null;
                List<String> roles = id == null ? List.of() : identityProvider.getUserRoles(id);
                List<String> groups = id == null ? List.of() : identityProvider.getUserGroups(id);
                return UserMapper.toResponse(user, roles, groups);
            })
            .toList();
    }
}
