package com.digao.digao_oauth_service.application.usecases.groups;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.groups.CreateGroupRequest;
import com.digao.digao_oauth_service.application.dto.groups.GroupResponse;
import com.digao.digao_oauth_service.application.mappers.GroupMapper;
import com.digao.digao_oauth_service.core.domain.entities.Group;
import com.digao.digao_oauth_service.core.ports.GroupProviderPort;

@Service
public class CreateGroupUseCase {
    private final GroupProviderPort groupProvider;

    public CreateGroupUseCase(GroupProviderPort groupProvider) {
        this.groupProvider = groupProvider;
    }

    public GroupResponse execute(CreateGroupRequest request) {
        Group group = GroupMapper.toDomain(request);
        String id = groupProvider.createGroup(group);

        Group baseGroup = groupProvider.getGroupById(id)
            .orElseThrow(() -> new IllegalStateException("Grupo criado, mas não encontrado no Keycloak."));

        return GroupMapper.toResponse(baseGroup);
    }
}
