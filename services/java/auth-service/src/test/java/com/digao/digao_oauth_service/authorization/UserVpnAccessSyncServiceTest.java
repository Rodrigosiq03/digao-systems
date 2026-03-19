package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.digao.digao_oauth_service.application.authorization.AuditLogService;
import com.digao.digao_oauth_service.application.vpn.UserVpnAccessSyncResult;
import com.digao.digao_oauth_service.application.vpn.UserVpnAccessSyncService;
import com.digao.digao_oauth_service.application.vpn.VpnObservedUser;
import com.digao.digao_oauth_service.application.vpn.VpnProviderClient;
import com.digao.digao_oauth_service.core.domain.entities.User;
import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.UserVpnAccessRepository;
import com.digao.digao_oauth_service.infra.vpn.VpnSyncProperties;

@ExtendWith(MockitoExtension.class)
class UserVpnAccessSyncServiceTest {

    @Mock
    private IdentityProviderPort identityProviderPort;

    @Mock
    private UserVpnAccessRepository userVpnAccessRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private VpnProviderClient vpnProviderClient;

    @Test
    void promotesMatchedUserToActiveUsingEmailAndCreatesRecordWhenMissing() {
        VpnSyncProperties properties = new VpnSyncProperties(
            true,
            "0 */15 * * * *",
            "tailscale",
            "https://api.tailscale.com",
            "tailnet.example.ts.net",
            "token",
            100
        );
        UserVpnAccessSyncService service = new UserVpnAccessSyncService(
            properties,
            identityProviderPort,
            userVpnAccessRepository,
            auditLogService,
            List.of(vpnProviderClient)
        );

        User keycloakUser = new User(
            UUID.randomUUID(),
            "owner-user",
            "owner@example.com",
            "Owner",
            "User",
            null,
            true
        );
        OffsetDateTime lastSeenAt = OffsetDateTime.parse("2026-03-18T22:30:00Z");
        OffsetDateTime observedAt = OffsetDateTime.parse("2026-03-18T22:35:00Z");

        when(identityProviderPort.getAllUsers(0, 100)).thenReturn(List.of(keycloakUser));
        when(vpnProviderClient.provider()).thenReturn("tailscale");
        when(vpnProviderClient.listObservedUsers()).thenReturn(List.of(
            new VpnObservedUser("owner@example.com", "owner", lastSeenAt, observedAt, true)
        ));
        when(userVpnAccessRepository.findByKeycloakUserIdAndProvider(keycloakUser.getId().toString(), "tailscale"))
            .thenReturn(Optional.empty());
        when(userVpnAccessRepository.save(any(UserVpnAccessEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        UserVpnAccessSyncResult result = service.sync("vpn-sync");

        ArgumentCaptor<UserVpnAccessEntity> entityCaptor = ArgumentCaptor.forClass(UserVpnAccessEntity.class);
        verify(userVpnAccessRepository).save(entityCaptor.capture());
        verify(auditLogService).record("vpn-sync", "user_vpn_access.detected", "user_vpn_access", keycloakUser.getId() + ":tailscale");

        UserVpnAccessEntity saved = entityCaptor.getValue();
        assertEquals("active", saved.getState());
        assertEquals("tailscale", saved.getProvider());
        assertEquals("owner", saved.getProviderRole());
        assertEquals(lastSeenAt, saved.getProviderLastSeenAt());
        assertEquals(observedAt, saved.getProviderObservedAt());
        assertNotNull(saved.getActivatedAt());
        assertEquals(1, result.totalObservedUsers());
        assertEquals(1, result.totalMatchedUsers());
        assertEquals(1, result.totalUpdatedUsers());
    }

    @Test
    void promotesInvitePendingRecordToActiveWhenProviderConfirmsAccess() {
        VpnSyncProperties properties = new VpnSyncProperties(
            true,
            "0 */15 * * * *",
            "tailscale",
            "https://api.tailscale.com",
            "tailnet.example.ts.net",
            "token",
            100
        );
        UserVpnAccessSyncService service = new UserVpnAccessSyncService(
            properties,
            identityProviderPort,
            userVpnAccessRepository,
            auditLogService,
            List.of(vpnProviderClient)
        );

        User keycloakUser = new User(
            UUID.randomUUID(),
            "member-user",
            "member@example.com",
            "Member",
            "User",
            null,
            true
        );
        UserVpnAccessEntity existing = UserVpnAccessEntity.create(
            keycloakUser.getId().toString(),
            "tailscale",
            "invite_pending",
            "https://login.tailscale.com/admin/invite",
            "Pending invite",
            "admin-master"
        );
        OffsetDateTime inviteTimestamp = existing.getInvitedAt();
        OffsetDateTime lastSeenAt = OffsetDateTime.parse("2026-03-18T22:40:00Z");
        OffsetDateTime observedAt = OffsetDateTime.parse("2026-03-18T22:41:00Z");

        when(identityProviderPort.getAllUsers(0, 100)).thenReturn(List.of(keycloakUser));
        when(vpnProviderClient.provider()).thenReturn("tailscale");
        when(vpnProviderClient.listObservedUsers()).thenReturn(List.of(
            new VpnObservedUser("member@example.com", "member", lastSeenAt, observedAt, true)
        ));
        when(userVpnAccessRepository.findByKeycloakUserIdAndProvider(keycloakUser.getId().toString(), "tailscale"))
            .thenReturn(Optional.of(existing));
        when(userVpnAccessRepository.save(any(UserVpnAccessEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        UserVpnAccessSyncResult result = service.sync("vpn-sync");

        verify(auditLogService).record("vpn-sync", "user_vpn_access.activated", "user_vpn_access", keycloakUser.getId() + ":tailscale");

        assertEquals("active", existing.getState());
        assertEquals("member", existing.getProviderRole());
        assertEquals(lastSeenAt, existing.getProviderLastSeenAt());
        assertEquals(observedAt, existing.getProviderObservedAt());
        assertEquals(inviteTimestamp, existing.getInvitedAt());
        assertNotNull(existing.getActivatedAt());
        assertEquals(1, result.totalUpdatedUsers());
    }

    @Test
    void doesNotDowngradeExistingStateWhenProviderDoesNotReturnTheUser() {
        VpnSyncProperties properties = new VpnSyncProperties(
            true,
            "0 */15 * * * *",
            "tailscale",
            "https://api.tailscale.com",
            "tailnet.example.ts.net",
            "token",
            100
        );
        UserVpnAccessSyncService service = new UserVpnAccessSyncService(
            properties,
            identityProviderPort,
            userVpnAccessRepository,
            auditLogService,
            List.of(vpnProviderClient)
        );

        User keycloakUser = new User(
            UUID.randomUUID(),
            "invite-user",
            "invite@example.com",
            "Invite",
            "User",
            null,
            true
        );

        when(identityProviderPort.getAllUsers(0, 100)).thenReturn(List.of(keycloakUser));
        when(vpnProviderClient.provider()).thenReturn("tailscale");
        when(vpnProviderClient.listObservedUsers()).thenReturn(List.of());

        UserVpnAccessSyncResult result = service.sync("vpn-sync");

        verify(userVpnAccessRepository, never()).save(any(UserVpnAccessEntity.class));
        verify(userVpnAccessRepository, never()).findByKeycloakUserIdAndProvider(eq(keycloakUser.getId().toString()), eq("tailscale"));
        assertEquals(0, result.totalMatchedUsers());
        assertEquals(0, result.totalUpdatedUsers());
    }

    @Test
    void doesNotCreateAuditNoiseWhenActiveRecordOnlyRefreshesProviderTimestamps() {
        VpnSyncProperties properties = new VpnSyncProperties(
            true,
            "0 */15 * * * *",
            "tailscale",
            "https://api.tailscale.com",
            "tailnet.example.ts.net",
            "token",
            100
        );
        UserVpnAccessSyncService service = new UserVpnAccessSyncService(
            properties,
            identityProviderPort,
            userVpnAccessRepository,
            auditLogService,
            List.of(vpnProviderClient)
        );

        User keycloakUser = new User(
            UUID.randomUUID(),
            "steady-user",
            "steady@example.com",
            "Steady",
            "User",
            null,
            true
        );
        UserVpnAccessEntity existing = UserVpnAccessEntity.create(
            keycloakUser.getId().toString(),
            "tailscale",
            "active",
            null,
            null,
            "admin-master"
        );
        existing.observe(
            "member",
            OffsetDateTime.parse("2026-03-18T20:00:00Z"),
            OffsetDateTime.parse("2026-03-18T20:05:00Z"),
            "vpn-sync"
        );

        when(identityProviderPort.getAllUsers(0, 100)).thenReturn(List.of(keycloakUser));
        when(vpnProviderClient.provider()).thenReturn("tailscale");
        when(vpnProviderClient.listObservedUsers()).thenReturn(List.of(
            new VpnObservedUser(
                "steady@example.com",
                "member",
                OffsetDateTime.parse("2026-03-18T22:50:00Z"),
                OffsetDateTime.parse("2026-03-18T22:51:00Z"),
                true
            )
        ));
        when(userVpnAccessRepository.findByKeycloakUserIdAndProvider(keycloakUser.getId().toString(), "tailscale"))
            .thenReturn(Optional.of(existing));
        when(userVpnAccessRepository.save(any(UserVpnAccessEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        service.sync("vpn-sync");

        verify(userVpnAccessRepository).save(any(UserVpnAccessEntity.class));
        verify(auditLogService, never()).record(eq("vpn-sync"), eq("user_vpn_access.role_changed"), any(), any());
        verify(auditLogService, never()).record(eq("vpn-sync"), eq("user_vpn_access.activated"), any(), any());
        verify(auditLogService, never()).record(eq("vpn-sync"), eq("user_vpn_access.detected"), any(), any());
    }

    @Test
    void recordsRoleChangedWhenProviderRoleChangesForKnownUser() {
        VpnSyncProperties properties = new VpnSyncProperties(
            true,
            "0 */15 * * * *",
            "tailscale",
            "https://api.tailscale.com",
            "tailnet.example.ts.net",
            "token",
            100
        );
        UserVpnAccessSyncService service = new UserVpnAccessSyncService(
            properties,
            identityProviderPort,
            userVpnAccessRepository,
            auditLogService,
            List.of(vpnProviderClient)
        );

        User keycloakUser = new User(
            UUID.randomUUID(),
            "role-user",
            "role@example.com",
            "Role",
            "User",
            null,
            true
        );
        UserVpnAccessEntity existing = UserVpnAccessEntity.create(
            keycloakUser.getId().toString(),
            "tailscale",
            "active",
            null,
            null,
            "admin-master"
        );
        existing.observe(
            "member",
            OffsetDateTime.parse("2026-03-18T21:00:00Z"),
            OffsetDateTime.parse("2026-03-18T21:05:00Z"),
            "vpn-sync"
        );

        when(identityProviderPort.getAllUsers(0, 100)).thenReturn(List.of(keycloakUser));
        when(vpnProviderClient.provider()).thenReturn("tailscale");
        when(vpnProviderClient.listObservedUsers()).thenReturn(List.of(
            new VpnObservedUser(
                "role@example.com",
                "owner",
                OffsetDateTime.parse("2026-03-18T22:55:00Z"),
                OffsetDateTime.parse("2026-03-18T22:56:00Z"),
                true
            )
        ));
        when(userVpnAccessRepository.findByKeycloakUserIdAndProvider(keycloakUser.getId().toString(), "tailscale"))
            .thenReturn(Optional.of(existing));
        when(userVpnAccessRepository.save(any(UserVpnAccessEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        service.sync("vpn-sync");

        verify(auditLogService).record("vpn-sync", "user_vpn_access.role_changed", "user_vpn_access", keycloakUser.getId() + ":tailscale");
        assertEquals("owner", existing.getProviderRole());
    }

    @Test
    void ignoresObservedUsersWithoutKeycloakEmailMatch() {
        VpnSyncProperties properties = new VpnSyncProperties(
            true,
            "0 */15 * * * *",
            "tailscale",
            "https://api.tailscale.com",
            "tailnet.example.ts.net",
            "token",
            100
        );
        UserVpnAccessSyncService service = new UserVpnAccessSyncService(
            properties,
            identityProviderPort,
            userVpnAccessRepository,
            auditLogService,
            List.of(vpnProviderClient)
        );

        User keycloakUser = new User(
            UUID.randomUUID(),
            "other-user",
            "other@example.com",
            "Other",
            "User",
            null,
            true
        );
        OffsetDateTime observedAt = OffsetDateTime.parse("2026-03-18T22:45:00Z");

        when(identityProviderPort.getAllUsers(0, 100)).thenReturn(List.of(keycloakUser));
        when(vpnProviderClient.provider()).thenReturn("tailscale");
        when(vpnProviderClient.listObservedUsers()).thenReturn(List.of(
            new VpnObservedUser("missing@example.com", "member", null, observedAt, true)
        ));

        UserVpnAccessSyncResult result = service.sync("vpn-sync");

        verify(userVpnAccessRepository, never()).save(any(UserVpnAccessEntity.class));
        assertEquals(1, result.totalObservedUsers());
        assertEquals(0, result.totalMatchedUsers());
        assertEquals(0, result.totalUpdatedUsers());
    }
}
