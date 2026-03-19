package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.util.HashSet;
import java.util.Set;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.digao.digao_oauth_service.DigaoOauthServiceApplication;

@SpringBootTest(classes = DigaoOauthServiceApplication.class, properties = {
    "spring.datasource.url=jdbc:h2:mem:flyway-runtime;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/digao-oauth-dev",
    "keycloak.admin.server-url=http://localhost:8080",
    "keycloak.admin.realm=digao-oauth-dev",
    "keycloak.admin.client-id=test-client",
    "keycloak.admin.client-secret=test-secret",
    "digao.cors.allowed-origins=http://localhost:3000",
    "digao.notification.login-url=http://localhost:3000",
    "digao.vpn-sync.enabled=false"
})
class FlywayRuntimeMigrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired(required = false)
    private Flyway flyway;

    @Test
    void applicationContextProvidesFlywayAndMigratesVpnAccessSchema() throws Exception {
        assertTrue(flyway != null, "Expected Flyway bean to be present in application context");

        try (Connection connection = dataSource.getConnection();
             var result = connection.getMetaData().getTables(null, null, "%", new String[]{"TABLE"})) {
            Set<String> tables = new HashSet<>();
            while (result.next()) {
                tables.add(result.getString("TABLE_NAME").toLowerCase());
            }

            assertTrue(tables.contains("user_vpn_access"), "Expected user_vpn_access to be created by runtime migrations");
            assertTrue(tables.contains("flyway_schema_history"), "Expected flyway_schema_history to be present");
        }
    }
}
