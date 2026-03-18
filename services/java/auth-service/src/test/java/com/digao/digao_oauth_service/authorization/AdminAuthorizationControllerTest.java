package com.digao.digao_oauth_service.authorization;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import com.digao.digao_oauth_service.application.authorization.CapabilityAdminService;
import com.digao.digao_oauth_service.application.authorization.ProfileAdminService;
import com.digao.digao_oauth_service.application.authorization.SystemAdminService;
import com.digao.digao_oauth_service.application.authorization.UserProfileAdminService;
import com.digao.digao_oauth_service.application.authorization.UserVpnAccessAdminService;
import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.SystemEntity;
import com.digao.digao_oauth_service.infra.security.SecurityConfig;
import com.digao.digao_oauth_service.presentation.controllers.AdminAuditLogsController;
import com.digao.digao_oauth_service.presentation.controllers.AdminCapabilitiesController;
import com.digao.digao_oauth_service.presentation.controllers.AdminProfileCapabilitiesController;
import com.digao.digao_oauth_service.presentation.controllers.AdminProfilesController;
import com.digao.digao_oauth_service.presentation.controllers.AdminSystemsController;
import com.digao.digao_oauth_service.presentation.controllers.AdminUserProfilesController;
import com.digao.digao_oauth_service.presentation.controllers.AdminUserVpnAccessController;
import com.digao.digao_oauth_service.presentation.handlers.GlobalExceptionHandler;

@SpringBootTest(classes = AdminAuthorizationControllerTest.MvcTestApplication.class, properties = {
    "spring.datasource.url=jdbc:h2:mem:authadmin;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "spring.main.web-application-type=servlet"
})
@AutoConfigureMockMvc
class AdminAuthorizationControllerTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EntityScan(basePackages = "com.digao.digao_oauth_service.domain.authorization")
    @EnableJpaRepositories(basePackages = "com.digao.digao_oauth_service.domain.authorization.repository")
    @ComponentScan(basePackages = "com.digao.digao_oauth_service.application.authorization")
    @Import({
        AdminSystemsController.class,
        AdminCapabilitiesController.class,
        AdminProfilesController.class,
        AdminProfileCapabilitiesController.class,
        AdminUserProfilesController.class,
        AdminUserVpnAccessController.class,
        AdminAuditLogsController.class,
        SecurityConfig.class,
        GlobalExceptionHandler.class
    })
    static class MvcTestApplication {
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SystemAdminService systemAdminService;

    @Autowired
    private CapabilityAdminService capabilityAdminService;

    @Autowired
    private ProfileAdminService profileAdminService;

    @Autowired
    private UserProfileAdminService userProfileAdminService;

    @Autowired
    private UserVpnAccessAdminService userVpnAccessAdminService;

    @Test
    void adminMasterCanCreateSystem() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        mockMvc.perform(post("/admin/systems")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "key": "cloud-gaming-%s",
                      "name": "Cloud Gaming %s"
                    }
                    """.formatted(suffix, suffix)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.key").value("cloud-gaming-" + suffix))
            .andExpect(jsonPath("$.enabled").value(true));

        SystemEntity seeded = systemAdminService.create("disable-system-" + suffix, "Disable System " + suffix, "seed");

        mockMvc.perform(patch("/admin/systems/{systemId}/disable", seeded.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(seeded.getId()))
            .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    void adminMasterCanCreateCapabilityProfileGrantAndAssignment() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        SystemEntity system = systemAdminService.create("system-" + suffix, "System " + suffix, "seed");
        ProfileEntity grantProfile = profileAdminService.create("grant-profile-" + suffix, "Grant Profile " + suffix, "seed");
        CapabilityEntity grantCapability = capabilityAdminService.create(system.getId(), "grant.capability." + suffix, "Grant Capability " + suffix, "seed");
        ProfileEntity disableProfile = profileAdminService.create("disable-profile-" + suffix, "Disable Profile " + suffix, "seed");
        CapabilityEntity disableCapability = capabilityAdminService.create(system.getId(), "disable.capability." + suffix, "Disable Capability " + suffix, "seed");
        var assignment = userProfileAdminService.assign("kc-revoke-" + suffix, disableProfile.getId(), "seed");

        mockMvc.perform(post("/admin/capabilities")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "systemId": %d,
                      "key": "catalog.manage.%s",
                      "name": "Catalog manage %s"
                    }
                    """.formatted(system.getId(), suffix, suffix)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.systemId").value(system.getId()))
            .andExpect(jsonPath("$.key").value("catalog.manage." + suffix));

        mockMvc.perform(post("/admin/profiles")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "key": "cloud-gaming-curator-%s",
                      "name": "Cloud Gaming Curator %s"
                    }
                    """.formatted(suffix, suffix)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.key").value("cloud-gaming-curator-" + suffix));

        mockMvc.perform(post("/admin/profile-capabilities")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "profileId": %d,
                      "capabilityId": %d
                    }
                    """.formatted(grantProfile.getId(), grantCapability.getId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.profileKey").value("grant-profile-" + suffix))
            .andExpect(jsonPath("$.capabilityKey").value("grant.capability." + suffix));

        mockMvc.perform(post("/admin/user-profiles")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "keycloakUserId": "kc-user-%s",
                      "profileId": %d
                    }
                    """.formatted(suffix, grantProfile.getId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.keycloakUserId").value("kc-user-" + suffix))
            .andExpect(jsonPath("$.profileKey").value("grant-profile-" + suffix));

        mockMvc.perform(patch("/admin/capabilities/{capabilityId}/disable", disableCapability.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(disableCapability.getId()))
            .andExpect(jsonPath("$.enabled").value(false));

        mockMvc.perform(patch("/admin/profiles/{profileId}/disable", disableProfile.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(disableProfile.getId()))
            .andExpect(jsonPath("$.enabled").value(false));

        mockMvc.perform(patch("/admin/user-profiles/{assignmentId}/revoke", assignment.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(assignment.getId()))
            .andExpect(jsonPath("$.keycloakUserId").value("kc-revoke-" + suffix))
            .andExpect(jsonPath("$.profileKey").value("disable-profile-" + suffix));
    }

    @Test
    void adminMasterCanUpsertAndReadUserVpnAccess() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        mockMvc.perform(put("/admin/users/{userId}/vpn-access/{provider}", "kc-user-" + suffix, "tailscale")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "status": "invite_pending",
                      "inviteLink": "https://login.tailscale.com/admin/invite",
                      "notes": "Pending manual invite"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.keycloakUserId").value("kc-user-" + suffix))
            .andExpect(jsonPath("$.provider").value("tailscale"))
            .andExpect(jsonPath("$.status").value("invite_pending"));

        mockMvc.perform(get("/admin/users/{userId}/vpn-access", "kc-user-" + suffix)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_MASTER"))
                    .jwt(token -> token.subject("admin-master"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].provider").value("tailscale"))
            .andExpect(jsonPath("$[0].status").value("invite_pending"));
    }

    @Test
    void adminCanListAdminResourcesButCannotWrite() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        SystemEntity system = systemAdminService.create("read-system-" + suffix, "Read System " + suffix, "seed");
        ProfileEntity profile = profileAdminService.create("read-profile-" + suffix, "Read Profile " + suffix, "seed");
        userProfileAdminService.assign("kc-user-" + suffix, profile.getId(), "seed");
        userVpnAccessAdminService.upsert("kc-user-" + suffix, "tailscale", "active", "https://login.tailscale.com/admin/invite", "Active", "seed");

        mockMvc.perform(get("/admin/systems")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].key", hasItem("read-system-" + suffix)));

        mockMvc.perform(get("/admin/profiles")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].key", hasItem("read-profile-" + suffix)));

        mockMvc.perform(get("/admin/user-profiles")
                .param("keycloakUserId", "kc-user-" + suffix)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].keycloakUserId").value("kc-user-" + suffix));

        mockMvc.perform(get("/admin/audit-logs")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].action", hasItem("system.created")));

        mockMvc.perform(get("/admin/users/{userId}/vpn-access", "kc-user-" + suffix)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("active"));

        mockMvc.perform(post("/admin/systems")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "key": "forbidden-system",
                      "name": "Forbidden System"
                    }
                    """))
            .andExpect(status().isForbidden());

        mockMvc.perform(patch("/admin/systems/{systemId}/disable", system.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer"))))
            .andExpect(status().isForbidden());

        mockMvc.perform(post("/admin/profiles")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "key": "forbidden-profile",
                      "name": "Forbidden Profile"
                    }
                    """))
            .andExpect(status().isForbidden());

        mockMvc.perform(patch("/admin/profiles/{profileId}/disable", profile.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer"))))
            .andExpect(status().isForbidden());

        mockMvc.perform(put("/admin/users/{userId}/vpn-access/{provider}", "kc-user-" + suffix, "tailscale")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt(token -> token.subject("admin-viewer")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "status": "revoked",
                      "inviteLink": "https://login.tailscale.com/admin/invite",
                      "notes": "Forbidden"
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void commonCannotAccessAdministrativeSystemsEndpoints() throws Exception {
        mockMvc.perform(get("/admin/systems")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_COMMON"))
                    .jwt(token -> token.subject("common-user"))))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/admin/audit-logs")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_COMMON"))
                    .jwt(token -> token.subject("common-user"))))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/admin/users/{userId}/vpn-access", "kc-common")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_COMMON"))
                    .jwt(token -> token.subject("common-user"))))
            .andExpect(status().isForbidden());
    }
}
