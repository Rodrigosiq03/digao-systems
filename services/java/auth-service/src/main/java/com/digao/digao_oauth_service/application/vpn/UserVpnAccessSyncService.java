package com.digao.digao_oauth_service.application.vpn;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digao.digao_oauth_service.core.domain.entities.User;
import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;
import com.digao.digao_oauth_service.application.authorization.AuditLogService;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.UserVpnAccessRepository;
import com.digao.digao_oauth_service.infra.vpn.VpnSyncProperties;

@Service
public class UserVpnAccessSyncService {

    private final VpnSyncProperties properties;
    private final IdentityProviderPort identityProviderPort;
    private final UserVpnAccessRepository userVpnAccessRepository;
    private final AuditLogService auditLogService;
    private final List<VpnProviderClient> providerClients;

    public UserVpnAccessSyncService(
        VpnSyncProperties properties,
        IdentityProviderPort identityProviderPort,
        UserVpnAccessRepository userVpnAccessRepository,
        AuditLogService auditLogService,
        List<VpnProviderClient> providerClients
    ) {
        this.properties = properties;
        this.identityProviderPort = identityProviderPort;
        this.userVpnAccessRepository = userVpnAccessRepository;
        this.auditLogService = auditLogService;
        this.providerClients = providerClients;
    }

    @Transactional
    public UserVpnAccessSyncResult sync(String actor) {
        if (!properties.enabled()) {
            return UserVpnAccessSyncResult.disabled();
        }

        VpnProviderClient providerClient = providerClients.stream()
            .filter(client -> client.provider().equalsIgnoreCase(properties.provider()))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("No VPN provider client registered for provider=" + properties.provider()));

        Map<String, User> keycloakUsersByEmail = loadKeycloakUsersByEmail();
        List<VpnObservedUser> observedUsers = providerClient.listObservedUsers();
        int matchedUsers = 0;
        int updatedUsers = 0;

        for (VpnObservedUser observedUser : observedUsers) {
            String observedEmail = normalizeEmail(observedUser.email());
            if (observedEmail == null) {
                continue;
            }

            User matchedUser = keycloakUsersByEmail.get(observedEmail);
            if (matchedUser == null) {
                continue;
            }
            matchedUsers++;

            if (!observedUser.active()) {
                continue;
            }

            String keycloakUserId = matchedUser.getId().toString();
            UserVpnAccessEntity entity = userVpnAccessRepository.findByKeycloakUserIdAndProvider(keycloakUserId, properties.provider())
                .map(existing -> {
                    if (!"active".equals(existing.getState())) {
                        existing.apply("active", existing.getInviteLink(), existing.getNotes(), actor);
                    }
                    existing.observe(observedUser.role(), observedUser.lastSeenAt(), observedUser.observedAt(), actor);
                    return existing;
                })
                .orElseGet(() -> {
                    UserVpnAccessEntity created = UserVpnAccessEntity.create(
                        keycloakUserId,
                        properties.provider(),
                        "active",
                        null,
                        null,
                        actor
                    );
                    created.observe(observedUser.role(), observedUser.lastSeenAt(), observedUser.observedAt(), actor);
                    return created;
                });

            userVpnAccessRepository.save(entity);
            auditLogService.record(actor, "user_vpn_access.provider_synced", "user_vpn_access", keycloakUserId + ":" + properties.provider());
            updatedUsers++;
        }

        return new UserVpnAccessSyncResult(observedUsers.size(), matchedUsers, updatedUsers);
    }

    private Map<String, User> loadKeycloakUsersByEmail() {
        Map<String, User> usersByEmail = new HashMap<>();
        int page = 0;
        int pageSize = properties.userPageSize();

        while (true) {
            List<User> users = identityProviderPort.getAllUsers(page, pageSize);
            if (users.isEmpty()) {
                break;
            }
            users.stream()
                .filter(Objects::nonNull)
                .filter(user -> normalizeEmail(user.getEmail()) != null)
                .forEach(user -> usersByEmail.put(normalizeEmail(user.getEmail()), user));
            if (users.size() < pageSize) {
                break;
            }
            page++;
        }

        return usersByEmail;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
