package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

class AuthorizationAuditCleanupMigrationTest {

    @Test
    void removesRedundantProviderSyncedAuditLogsWhilePreservingUsefulEvents() throws Exception {
        String jdbcUrl = "jdbc:h2:mem:auditcleanup;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

        Flyway.configure()
            .dataSource(jdbcUrl, "sa", "")
            .locations("classpath:db/migration")
            .target("6")
            .load()
            .migrate();

        try (Connection connection = DriverManager.getConnection(jdbcUrl, "sa", "");
             PreparedStatement statement = connection.prepareStatement("""
                 insert into audit_logs (
                     actor_user_id, actor_email, action, target_type, target_id, before_json, after_json, created_at
                 ) values (?, ?, ?, ?, ?, ?, ?, now())
                 """)) {
            statement.setString(1, "vpn-sync");
            statement.setString(2, "vpn-sync@system");
            statement.setString(3, "user_vpn_access.provider_synced");
            statement.setString(4, "user_vpn_access");
            statement.setString(5, "kc-user-1:tailscale");
            statement.setString(6, null);
            statement.setString(7, null);
            statement.executeUpdate();

            statement.setString(1, "vpn-sync");
            statement.setString(2, "vpn-sync@system");
            statement.setString(3, "user_vpn_access.provider_synced");
            statement.setString(4, "user_vpn_access");
            statement.setString(5, "kc-user-1:tailscale");
            statement.setString(6, null);
            statement.setString(7, null);
            statement.executeUpdate();

            statement.setString(1, "vpn-sync");
            statement.setString(2, "vpn-sync@system");
            statement.setString(3, "user_vpn_access.activated");
            statement.setString(4, "user_vpn_access");
            statement.setString(5, "kc-user-1:tailscale");
            statement.setString(6, null);
            statement.setString(7, null);
            statement.executeUpdate();
        }

        Flyway.configure()
            .dataSource(jdbcUrl, "sa", "")
            .locations("classpath:db/migration")
            .load()
            .migrate();

        try (Connection connection = DriverManager.getConnection(jdbcUrl, "sa", "");
             ResultSet resultSet = connection.createStatement().executeQuery("""
                 select action, count(*) as total
                 from audit_logs
                 group by action
                 order by action
                 """)) {
            long providerSyncedTotal = 0L;
            long activatedTotal = 0L;
            while (resultSet.next()) {
                if ("user_vpn_access.provider_synced".equals(resultSet.getString("action"))) {
                    providerSyncedTotal = resultSet.getLong("total");
                }
                if ("user_vpn_access.activated".equals(resultSet.getString("action"))) {
                    activatedTotal = resultSet.getLong("total");
                }
            }

            assertEquals(0L, providerSyncedTotal);
            assertEquals(1L, activatedTotal);
        }
    }
}
