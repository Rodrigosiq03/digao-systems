from pathlib import Path
import unittest


class AuthServicePortalAuthorizationDbConfigTest(unittest.TestCase):
    def test_auth_service_requires_authorization_db_config(self):
        source = Path("pulumi/auth-service/__main__.py").read_text()
        self.assertIn('authorization_db_url = config.require("authorizationDbJdbcUrl")', source)
        self.assertIn('authorization_db_user = config.require("authorizationDbUser")', source)
        self.assertIn('authorization_db_password = config.require_secret("authorizationDbPassword")', source)
        self.assertIn("SPRING_DATASOURCE_URL=", source)
        self.assertIn("SPRING_DATASOURCE_USERNAME=", source)
        self.assertIn("SPRING_DATASOURCE_PASSWORD=", source)

    def test_workflow_injects_authorization_db_runtime_config(self):
        source = Path(".github/workflows/pulumi-services.yml").read_text()
        self.assertIn("AUTH_SERVICE_AUTHORIZATION_DB_JDBC_URL", source)
        self.assertIn("AUTH_SERVICE_AUTHORIZATION_DB_USER", source)
        self.assertIn("AUTH_SERVICE_AUTHORIZATION_DB_PASSWORD", source)
        self.assertIn(
            'pulumi -C pulumi/auth-service config set auth-service:authorizationDbJdbcUrl "$AUTH_SERVICE_AUTHORIZATION_DB_JDBC_URL"',
            source,
        )
        self.assertIn(
            'pulumi -C pulumi/auth-service config set auth-service:authorizationDbUser "$AUTH_SERVICE_AUTHORIZATION_DB_USER"',
            source,
        )
        self.assertIn(
            'pulumi -C pulumi/auth-service config set --secret auth-service:authorizationDbPassword "$AUTH_SERVICE_AUTHORIZATION_DB_PASSWORD"',
            source,
        )


if __name__ == "__main__":
    unittest.main()
