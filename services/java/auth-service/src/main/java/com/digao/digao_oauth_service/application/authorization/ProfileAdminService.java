package com.digao.digao_oauth_service.application.authorization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileCapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.CapabilityRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.ProfileCapabilityRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.ProfileRepository;

@Service
public class ProfileAdminService {

    private final ProfileRepository profileRepository;
    private final CapabilityRepository capabilityRepository;
    private final ProfileCapabilityRepository profileCapabilityRepository;
    private final AuditLogService auditLogService;

    public ProfileAdminService(ProfileRepository profileRepository, CapabilityRepository capabilityRepository, ProfileCapabilityRepository profileCapabilityRepository, AuditLogService auditLogService) {
        this.profileRepository = profileRepository;
        this.capabilityRepository = capabilityRepository;
        this.profileCapabilityRepository = profileCapabilityRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public ProfileEntity create(String key, String name, String actor) {
        ProfileEntity entity = profileRepository.save(ProfileEntity.create(key, name));
        auditLogService.record(actor, "profile.created", "profile", entity.getId().toString());
        return entity;
    }

    @Transactional
    public ProfileCapabilityEntity grantCapability(Long profileId, Long capabilityId, String actor) {
        ProfileEntity profile = profileRepository.findById(profileId).orElseThrow();
        CapabilityEntity capability = capabilityRepository.findById(capabilityId).orElseThrow();
        ProfileCapabilityEntity entity = profileCapabilityRepository.save(ProfileCapabilityEntity.create(profile, capability, actor));
        auditLogService.record(actor, "profile_capability.granted", "profile_capability", entity.getId().toString());
        return entity;
    }
}
