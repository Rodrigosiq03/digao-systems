package com.digao.digao_oauth_service.application.usecases.groups;

import java.util.List;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.application.dto.groups.GroupResponse;
import com.digao.digao_oauth_service.application.mappers.GroupMapper;
import com.digao.digao_oauth_service.core.ports.GroupProviderPort;

@Service
public class ListGroupsUseCase {
    private final GroupProviderPort groupProvider;

    public ListGroupsUseCase(GroupProviderPort groupProvider) {
        this.groupProvider = groupProvider;
    }

    public List<GroupResponse> execute() {
        return groupProvider.getAllGroups().stream()
            .map(GroupMapper::toResponse)
            .toList();
    }
}
