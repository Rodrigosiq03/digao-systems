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
    private final UserVpnAccessMetricsService userVpnAccessMetricsService;

    public UserVpnAccessAdminService(
        UserVpnAccessRepository userVpnAccessRepository,
        AuditLogService auditLogService,
        UserVpnAccessMetricsService userVpnAccessMetricsService
    ) {
        this.userVpnAccessRepository = userVpnAccessRepository;
        this.auditLogService = auditLogService;
        this.userVpnAccessMetricsService = userVpnAccessMetricsService;
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
        String action = resolveAuditAction(status);
        UserVpnAccessEntity entity = userVpnAccessRepository.findByKeycloakUserIdAndProvider(keycloakUserId, provider)
            .map(existing -> {
                existing.apply(status, inviteLink, notes, actor);
                return existing;
            })
            .orElseGet(() -> UserVpnAccessEntity.create(keycloakUserId, provider, status, inviteLink, notes, actor));

        UserVpnAccessEntity saved = userVpnAccessRepository.save(entity);
        auditLogService.record(actor, action, "user_vpn_access", keycloakUserId + ":" + provider);
        userVpnAccessMetricsService.refreshTotals();
        return saved;
    }

    private String resolveAuditAction(String status) {
        return switch (status) {
            case "invite_pending" -> "user_vpn_access.invite_pending";
            case "active" -> "user_vpn_access.activated_manually";
            case "revoked" -> "user_vpn_access.revoked";
            default -> "user_vpn_access.updated";
        };
    }
}
