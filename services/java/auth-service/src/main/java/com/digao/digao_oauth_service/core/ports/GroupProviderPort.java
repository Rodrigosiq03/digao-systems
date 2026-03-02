package com.digao.digao_oauth_service.core.ports;

import java.util.List;
import java.util.Optional;

import com.digao.digao_oauth_service.core.domain.entities.Group;

public interface GroupProviderPort {
    String createGroup(Group group);
    Optional<Group> getGroupById(String id);
    List<Group> getAllGroups();
    void updateGroup(Group group);
}
