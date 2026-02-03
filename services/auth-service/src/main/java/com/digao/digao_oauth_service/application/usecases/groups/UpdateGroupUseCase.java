package com.digao.digao_oauth_service.application.usecases.groups;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.groups.GroupResponse;
import com.digao.digao_oauth_service.application.dto.groups.UpdateGroupRequest;
import com.digao.digao_oauth_service.application.mappers.GroupMapper;
import com.digao.digao_oauth_service.core.domain.entities.Group;
import com.digao.digao_oauth_service.core.ports.GroupProviderPort;
import com.digao.digao_oauth_service.helpers.errors.usecase.NoItemsFoundError;

@Service
public class UpdateGroupUseCase {
    private final GroupProviderPort groupProvider;

    public UpdateGroupUseCase(GroupProviderPort groupProvider) {
        this.groupProvider = groupProvider;
    }

    public GroupResponse execute(String id, UpdateGroupRequest request) {
        if (groupProvider.getGroupById(id).isEmpty()) {
            throw new NoItemsFoundError("grupo");
        }
        Group group = GroupMapper.toDomain(id, request);
        groupProvider.updateGroup(group);
        return groupProvider.getGroupById(id)
            .map(GroupMapper::toResponse)
            .orElseThrow(() -> new NoItemsFoundError("grupo"));
    }
}
