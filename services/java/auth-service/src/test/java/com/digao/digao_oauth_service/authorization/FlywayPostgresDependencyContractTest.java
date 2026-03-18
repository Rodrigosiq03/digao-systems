package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class FlywayPostgresDependencyContractTest {

    @Test
    void pomIncludesPostgresFlywayDatabaseModule() throws Exception {
        String pom = Files.readString(Path.of("pom.xml"));
        assertTrue(pom.contains("<artifactId>flyway-database-postgresql</artifactId>"));
    }
}
