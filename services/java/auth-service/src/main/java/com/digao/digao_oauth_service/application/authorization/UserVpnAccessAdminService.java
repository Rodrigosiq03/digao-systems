package com.digao.digao_oauth_service.application.authorization;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.UserVpnAccessRepository;

@Service
public class UserVpnAccessAdminService {

    private final UserVpnAccessRepository userVpnAccessRepository;
    private final AuditLogService auditLogService;

    public UserVpnAccessAdminService(UserVpnAccessRepository userVpnAccessRepository, AuditLogService auditLogService) {
        this.userVpnAccessRepository = userVpnAccessRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<UserVpnAccessEntity> listByUser(String keycloakUserId) {
        return userVpnAccessRepository.findAllByKeycloakUserIdOrderByProviderAsc(keycloakUserId);
    }

    @Transactional
    public UserVpnAccessEntity upsert(
        String keycloakUserId,
        String provider,
        String status,
        String inviteLink,
        String notes,
        String actor
    ) {
        UserVpnAccessEntity entity = userVpnAccessRepository.findByKeycloakUserIdAndProvider(keycloakUserId, provider)
            .map(existing -> {
                existing.apply(status, inviteLink, notes, actor);
                return existing;
            })
            .orElseGet(() -> UserVpnAccessEntity.create(keycloakUserId, provider, status, inviteLink, notes, actor));

        UserVpnAccessEntity saved = userVpnAccessRepository.save(entity);
        auditLogService.record(actor, "user_vpn_access.upserted", "user_vpn_access", keycloakUserId + ":" + provider);
        return saved;
    }
}
