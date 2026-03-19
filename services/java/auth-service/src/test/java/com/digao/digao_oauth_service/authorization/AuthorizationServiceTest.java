package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.time.OffsetDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.digao.digao_oauth_service.application.authorization.AuditLogService;
import com.digao.digao_oauth_service.application.authorization.CapabilityAdminService;
import com.digao.digao_oauth_service.application.authorization.ProfileAdminService;
import com.digao.digao_oauth_service.application.authorization.SystemAdminService;
import com.digao.digao_oauth_service.application.authorization.UserProfileAdminService;
import com.digao.digao_oauth_service.application.authorization.UserVpnAccessAdminService;
import com.digao.digao_oauth_service.domain.authorization.AuditLogEntity;
import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.SystemEntity;
import com.digao.digao_oauth_service.domain.authorization.UserProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.AuditLogRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.ProfileRepository;

@SpringBootTest(classes = AuthorizationServiceTest.ServiceTestApplication.class, properties = {
    "spring.datasource.url=jdbc:h2:mem:authservice;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "spring.main.web-application-type=none"
})
class AuthorizationServiceTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EntityScan(basePackages = "com.digao.digao_oauth_service.domain.authorization")
    @EnableJpaRepositories(basePackages = "com.digao.digao_oauth_service.domain.authorization.repository")
    @ComponentScan(basePackages = {
        "com.digao.digao_oauth_service.application.authorization",
        "com.digao.digao_oauth_service.application.metrics"
    })
    static class ServiceTestApplication {
    }

    @Autowired
    private SystemAdminService systemAdminService;

    @Autowired
    private CapabilityAdminService capabilityAdminService;

    @Autowired
    private ProfileAdminService profileAdminService;

    @Autowired
    private UserProfileAdminService userProfileAdminService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserVpnAccessAdminService userVpnAccessAdminService;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void createsDisablesAssignsAndAuditsAuthorizationObjects() {
        SystemEntity system = systemAdminService.create("cloud-gaming", "Cloud Gaming", "admin-master");
        CapabilityEntity capability = capabilityAdminService.create(system.getId(), "catalog.manage", "Catalog manage", "admin-master");
        ProfileEntity profile = profileAdminService.create("cloud-gaming-curator", "Cloud Gaming Curator", "admin-master");

        profileAdminService.grantCapability(profile.getId(), capability.getId(), "admin-master");
        UserProfileEntity assignment = userProfileAdminService.assign("kc-user-1", profile.getId(), "admin-master");
        UserVpnAccessEntity vpnAccess = userVpnAccessAdminService.upsert("kc-user-1", "tailscale", "invite_pending", "https://login.tailscale.com/admin/invite", "Pending invite", "admin-master");

        SystemEntity disabled = systemAdminService.disable(system.getId(), "admin-master");
        CapabilityEntity disabledCapability = capabilityAdminService.disable(capability.getId(), "admin-master");
        ProfileEntity disabledProfile = profileAdminService.disable(profile.getId(), "admin-master");
        UserProfileEntity revokedAssignment = userProfileAdminService.revoke(assignment.getId(), "admin-master");
        UserVpnAccessEntity activeVpnAccess = userVpnAccessAdminService.upsert("kc-user-1", "tailscale", "active", "https://login.tailscale.com/admin/invite", "Activated", "admin-master");
        List<AuditLogEntity> auditLogs = auditLogRepository.findAll();

        assertNotNull(assignment.getId());
        assertEquals("invite_pending", vpnAccess.getStatus());
        assertFalse(disabled.isEnabled());
        assertFalse(disabledCapability.isEnabled());
        assertFalse(disabledProfile.isEnabled());
        assertEquals(0, userProfileAdminService.listActiveAssignments("kc-user-1").size());
        assertNotNull(revokedAssignment.getId());
        assertEquals("active", activeVpnAccess.getStatus());
        assertTrue(auditLogs.size() >= 10);
        assertTrue(auditLogs.stream().anyMatch(log -> "system.created".equals(log.getAction())));
        assertTrue(auditLogs.stream().anyMatch(log -> "user_profile.assigned".equals(log.getAction())));
        assertTrue(auditLogs.stream().anyMatch(log -> "user_vpn_access.activated_manually".equals(log.getAction())));
        assertTrue(auditLogs.stream().anyMatch(log -> "capability.disabled".equals(log.getAction())));
        assertTrue(auditLogs.stream().anyMatch(log -> "profile.disabled".equals(log.getAction())));
        assertTrue(auditLogs.stream().anyMatch(log -> "user_profile.revoked".equals(log.getAction())));
        assertNotNull(auditLogService);
        assertEquals("cloud-gaming-curator", profileRepository.findById(profile.getId()).orElseThrow().getKey());
    }

    @Test
    void updatesSystemNameAndEntryUrlWhileKeepingKeyImmutableAndTracksDisableMetadata() {
        String suffix = java.util.UUID.randomUUID().toString().substring(0, 8);
        SystemEntity system = systemAdminService.create("cloud-gaming-" + suffix, "Cloud Gaming " + suffix, "admin-master");

        SystemEntity updated = systemAdminService.update(system.getId(), "Cloud Gaming Platform " + suffix, "https://cloud.example.com/" + suffix, "admin-master");
        SystemEntity disabled = systemAdminService.disable(system.getId(), "admin-master");

        List<AuditLogEntity> auditLogs = auditLogRepository.findAll();

        assertEquals(system.getKey(), updated.getKey());
        assertEquals("Cloud Gaming Platform " + suffix, updated.getName());
        assertEquals("https://cloud.example.com/" + suffix, updated.getEntryUrl());
        assertEquals("admin-master", updated.getUpdatedBy());
        assertNotNull(updated.getUpdatedAt());
        assertFalse(disabled.isEnabled());
        assertNotNull(disabled.getDisabledAt());
        assertEquals("admin-master", disabled.getDisabledBy());
        assertTrue(auditLogs.stream().anyMatch(log -> "system.updated".equals(log.getAction())));
        assertTrue(auditLogs.stream().anyMatch(log -> "system.disabled".equals(log.getAction())));
    }
}
