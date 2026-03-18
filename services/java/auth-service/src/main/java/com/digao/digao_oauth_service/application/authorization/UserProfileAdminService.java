package com.digao.digao_oauth_service.application.authorization;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.UserProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.ProfileRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.UserProfileRepository;

@Service
public class UserProfileAdminService {

    private final UserProfileRepository userProfileRepository;
    private final ProfileRepository profileRepository;
    private final AuditLogService auditLogService;

    public UserProfileAdminService(UserProfileRepository userProfileRepository, ProfileRepository profileRepository, AuditLogService auditLogService) {
        this.userProfileRepository = userProfileRepository;
        this.profileRepository = profileRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public UserProfileEntity assign(String keycloakUserId, Long profileId, String actor) {
        ProfileEntity profile = profileRepository.findById(profileId).orElseThrow();
        UserProfileEntity entity = userProfileRepository.save(UserProfileEntity.create(keycloakUserId, profile, actor));
        auditLogService.record(actor, "user_profile.assigned", "user_profile", entity.getId().toString());
        return entity;
    }

    @Transactional(readOnly = true)
    public List<UserProfileEntity> listActiveAssignments(String keycloakUserId) {
        return userProfileRepository.findAllByKeycloakUserIdAndRevokedAtIsNull(keycloakUserId);
    }

    @Transactional
    public UserProfileEntity revoke(Long assignmentId, String actor) {
        UserProfileEntity entity = userProfileRepository.findById(assignmentId).orElseThrow();
        entity.revoke(actor);
        auditLogService.record(actor, "user_profile.revoked", "user_profile", entity.getId().toString());
        return entity;
    }
}
