package com.digao.digao_oauth_service.authorization;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.ComponentScans;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import com.digao.digao_oauth_service.application.authorization.CapabilityAdminService;
import com.digao.digao_oauth_service.application.authorization.ProfileAdminService;
import com.digao.digao_oauth_service.application.authorization.SystemAdminService;
import com.digao.digao_oauth_service.application.authorization.UserProfileAdminService;
import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;
import com.digao.digao_oauth_service.domain.authorization.SystemEntity;
import com.digao.digao_oauth_service.infra.security.SecurityConfig;
import com.digao.digao_oauth_service.presentation.handlers.GlobalExceptionHandler;

@SpringBootTest(classes = AuthorizationResolutionTest.ResolutionTestApplication.class, properties = {
    "spring.datasource.url=jdbc:h2:mem:authresolve;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "spring.main.web-application-type=servlet"
})
@AutoConfigureMockMvc
class AuthorizationResolutionTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EntityScan(basePackages = "com.digao.digao_oauth_service.domain.authorization")
    @EnableJpaRepositories(basePackages = "com.digao.digao_oauth_service.domain.authorization.repository")
    @ComponentScans({
        @ComponentScan(basePackages = "com.digao.digao_oauth_service.application.authorization"),
        @ComponentScan(
            basePackages = "com.digao.digao_oauth_service.presentation.controllers",
            useDefaultFilters = false,
            includeFilters = @Filter(type = FilterType.REGEX, pattern = ".*MeAccessController")
        )
    })
    @Import({SecurityConfig.class, GlobalExceptionHandler.class})
    static class ResolutionTestApplication {
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

    @Test
    void returnsEffectiveAccessForAuthenticatedUser() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String userId = "kc-user-" + suffix;
        String systemKey = "cloud-gaming-" + suffix;
        String profileKey = "cloud-gaming-curator-" + suffix;
        String capabilityKey = "catalog.manage." + suffix;

        SystemEntity system = systemAdminService.create(systemKey, "Cloud Gaming " + suffix, "seed");
        CapabilityEntity capability = capabilityAdminService.create(system.getId(), capabilityKey, "Catalog Manage " + suffix, "seed");
        ProfileEntity profile = profileAdminService.create(profileKey, "Cloud Gaming Curator " + suffix, "seed");
        profileAdminService.grantCapability(profile.getId(), capability.getId(), "seed");
        userProfileAdminService.assign(userId, profile.getId(), "seed");

        mockMvc.perform(get("/me/access")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_COMMON"))
                    .jwt(token -> token.subject(userId))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.portalRoles", hasItem("COMMON")))
            .andExpect(jsonPath("$.profiles[*].key", hasItem(profileKey)))
            .andExpect(jsonPath("$.systems[0].key").value(systemKey))
            .andExpect(jsonPath("$.systems[0].capabilities[0]").value(capabilityKey));
    }
}
