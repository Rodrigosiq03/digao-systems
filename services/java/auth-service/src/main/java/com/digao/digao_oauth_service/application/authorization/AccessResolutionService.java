package com.digao.digao_oauth_service.application.authorization;

import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digao.digao_oauth_service.application.dto.authorization.AccessProfileResponse;
import com.digao.digao_oauth_service.application.dto.authorization.AccessSystemResponse;
import com.digao.digao_oauth_service.application.dto.authorization.MyAccessResponse;
import com.digao.digao_oauth_service.domain.authorization.ProfileCapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.UserProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.ProfileCapabilityRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.UserProfileRepository;

@Service
public class AccessResolutionService {

    private final UserProfileRepository userProfileRepository;
    private final ProfileCapabilityRepository profileCapabilityRepository;

    public AccessResolutionService(
        UserProfileRepository userProfileRepository,
        ProfileCapabilityRepository profileCapabilityRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.profileCapabilityRepository = profileCapabilityRepository;
    }

    @Transactional(readOnly = true)
    public MyAccessResponse resolve(String keycloakUserId, Collection<String> portalRoles) {
        List<UserProfileEntity> assignments = userProfileRepository.findAllByKeycloakUserIdAndRevokedAtIsNull(keycloakUserId);
        List<ProfileEntity> profiles = assignments.stream()
            .map(UserProfileEntity::getProfile)
            .distinct()
            .toList();

        List<ProfileCapabilityEntity> grants = profiles.isEmpty()
            ? List.of()
            : profileCapabilityRepository.findAllByProfileIdIn(profiles.stream().map(ProfileEntity::getId).toList());

        Map<Long, AccessSystemAccumulator> systems = new LinkedHashMap<>();
        for (ProfileCapabilityEntity grant : grants) {
            var capability = grant.getCapability();
            var system = capability.getSystem();
            AccessSystemAccumulator accumulator = systems.computeIfAbsent(
                system.getId(),
                ignored -> new AccessSystemAccumulator(system.getId(), system.getKey(), system.getName())
            );
            if (!accumulator.capabilities().contains(capability.getKey())) {
                accumulator.capabilities().add(capability.getKey());
            }
        }

        return new MyAccessResponse(
            portalRoles.stream().sorted().toList(),
            profiles.stream()
                .map(profile -> new AccessProfileResponse(profile.getId(), profile.getKey(), profile.getName()))
                .sorted(Comparator.comparing(AccessProfileResponse::key))
                .toList(),
            systems.values().stream()
                .map(acc -> new AccessSystemResponse(acc.id(), acc.key(), acc.name(), acc.capabilities().stream().sorted().toList()))
                .sorted(Comparator.comparing(AccessSystemResponse::key))
                .toList()
        );
    }

    private record AccessSystemAccumulator(Long id, String key, String name, List<String> capabilities) {
        private AccessSystemAccumulator(Long id, String key, String name) {
            this(id, key, name, new java.util.ArrayList<>());
        }
    }
}
