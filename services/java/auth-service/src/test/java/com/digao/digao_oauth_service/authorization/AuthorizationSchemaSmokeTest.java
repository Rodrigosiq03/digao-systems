package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.util.Set;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

class AuthorizationSchemaSmokeTest {

    @Test
    void flywayCreatesPortalAuthorizationTables() throws Exception {
        String jdbcUrl = "jdbc:h2:mem:authz;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

        Flyway flyway = Flyway.configure()
            .dataSource(jdbcUrl, "sa", "")
            .locations("classpath:db/migration")
            .load();

        flyway.migrate();

        try (Connection connection = DriverManager.getConnection(jdbcUrl, "sa", "");
             ResultSet result = connection.getMetaData().getTables(null, null, "%", new String[]{"TABLE"})) {
            Set<String> tables = new java.util.HashSet<>();
            while (result.next()) {
                tables.add(result.getString("TABLE_NAME").toLowerCase());
            }

            assertTrue(tables.contains("systems"));
            assertTrue(tables.contains("capabilities"));
            assertTrue(tables.contains("profiles"));
            assertTrue(tables.contains("profile_capabilities"));
            assertTrue(tables.contains("user_profiles"));
            assertTrue(tables.contains("audit_logs"));
        }
    }
}
