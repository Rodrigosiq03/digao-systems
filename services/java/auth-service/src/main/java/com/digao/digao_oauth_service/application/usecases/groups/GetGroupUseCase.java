package com.digao.digao_oauth_service.application.usecases.groups;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.groups.GroupResponse;
import com.digao.digao_oauth_service.application.mappers.GroupMapper;
import com.digao.digao_oauth_service.core.domain.entities.Group;
import com.digao.digao_oauth_service.core.ports.GroupProviderPort;
import com.digao.digao_oauth_service.helpers.errors.usecase.NoItemsFoundError;

@Service
public class GetGroupUseCase {
    private final GroupProviderPort groupProvider;

    public GetGroupUseCase(GroupProviderPort groupProvider) {
        this.groupProvider = groupProvider;
    }

    public GroupResponse execute(String id) {
        Group group = groupProvider.getGroupById(id)
            .orElseThrow(() -> new NoItemsFoundError("grupo"));
        return GroupMapper.toResponse(group);
    }
}
