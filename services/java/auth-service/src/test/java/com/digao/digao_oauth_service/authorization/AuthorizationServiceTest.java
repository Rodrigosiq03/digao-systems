package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

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
import com.digao.digao_oauth_service.domain.authorization.AuditLogEntity;
import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.SystemEntity;
import com.digao.digao_oauth_service.domain.authorization.UserProfileEntity;
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
    @ComponentScan(basePackages = "com.digao.digao_oauth_service.application.authorization")
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

        SystemEntity disabled = systemAdminService.disable(system.getId(), "admin-master");
        List<AuditLogEntity> auditLogs = auditLogRepository.findAll();

        assertNotNull(assignment.getId());
        assertFalse(disabled.isEnabled());
        assertEquals(1, userProfileAdminService.listActiveAssignments("kc-user-1").size());
        assertTrue(auditLogs.size() >= 5);
        assertTrue(auditLogs.stream().anyMatch(log -> "system.created".equals(log.getAction())));
        assertTrue(auditLogs.stream().anyMatch(log -> "user_profile.assigned".equals(log.getAction())));
        assertNotNull(auditLogService);
        assertEquals("cloud-gaming-curator", profileRepository.findById(profile.getId()).orElseThrow().getKey());
    }
}
