package com.digao.digao_oauth_service.application.mappers;

import com.digao.digao_oauth_service.application.dto.groups.CreateGroupRequest;
import com.digao.digao_oauth_service.application.dto.groups.GroupResponse;
import com.digao.digao_oauth_service.application.dto.groups.UpdateGroupRequest;
import com.digao.digao_oauth_service.core.domain.entities.Group;

public final class GroupMapper {
    private GroupMapper() {
    }

    public static Group toDomain(CreateGroupRequest request) {
        return new Group(null, request.name(), null, request.attributes());
    }

    public static Group toDomain(String id, UpdateGroupRequest request) {
        return new Group(id, request.name(), null, request.attributes());
    }

    public static GroupResponse toResponse(Group group) {
        return new GroupResponse(
            group.getId(),
            group.getName(),
            group.getPath(),
            group.getAttributes()
        );
    }

    
}
