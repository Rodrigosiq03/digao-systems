package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileCapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.SystemEntity;
import com.digao.digao_oauth_service.domain.authorization.UserProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.CapabilityRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.ProfileCapabilityRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.ProfileRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.SystemRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.UserProfileRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.UserVpnAccessRepository;

@SpringBootTest(classes = AuthorizationRepositoryTest.JpaTestApplication.class, properties = {
    "spring.datasource.url=jdbc:h2:mem:authrepo;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "spring.main.web-application-type=none"
})
class AuthorizationRepositoryTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EntityScan(basePackages = "com.digao.digao_oauth_service.domain.authorization")
    @EnableJpaRepositories(basePackages = "com.digao.digao_oauth_service.domain.authorization.repository")
    static class JpaTestApplication {
    }

    @Autowired
    private SystemRepository systemRepository;

    @Autowired
    private CapabilityRepository capabilityRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private ProfileCapabilityRepository profileCapabilityRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserVpnAccessRepository userVpnAccessRepository;

    @Test
    void persistsSystemsCapabilitiesProfilesAndAssignments() {
        SystemEntity system = systemRepository.save(SystemEntity.create("cloud-gaming", "Cloud Gaming"));
        CapabilityEntity capability = capabilityRepository.save(CapabilityEntity.create(system, "catalog.manage", "Catalog manage"));
        ProfileEntity profile = profileRepository.save(ProfileEntity.create("cloud-gaming-curator", "Cloud Gaming Curator"));

        ProfileCapabilityEntity grant = profileCapabilityRepository.save(ProfileCapabilityEntity.create(profile, capability, "admin-master"));
        UserProfileEntity assignment = userProfileRepository.save(UserProfileEntity.create("kc-user-1", profile, "admin-master"));
        UserVpnAccessEntity vpnAccess = userVpnAccessRepository.save(UserVpnAccessEntity.create("kc-user-1", "tailscale", "invite_pending", "https://login.tailscale.com/admin/invite", "Invited", "admin-master"));

        assertNotNull(system.getId());
        assertNotNull(capability.getId());
        assertNotNull(profile.getId());
        assertNotNull(grant.getId());
        assertNotNull(assignment.getId());
        assertNotNull(vpnAccess.getKeycloakUserId());

        List<CapabilityEntity> capabilities = capabilityRepository.findAllBySystemId(system.getId());
        List<UserProfileEntity> assignments = userProfileRepository.findAllByKeycloakUserIdAndRevokedAtIsNull("kc-user-1");
        UserVpnAccessEntity storedVpnAccess = userVpnAccessRepository.findByKeycloakUserIdAndProvider("kc-user-1", "tailscale").orElseThrow();

        assertEquals(1, capabilities.size());
        assertEquals("catalog.manage", capabilities.get(0).getKey());
        assertEquals(1, assignments.size());
        assertEquals("cloud-gaming-curator", assignments.get(0).getProfile().getKey());
        assertEquals("invite_pending", storedVpnAccess.getStatus());
    }
}
