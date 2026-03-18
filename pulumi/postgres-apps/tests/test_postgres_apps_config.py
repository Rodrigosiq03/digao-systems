from pathlib import Path
import unittest


class PostgresAppsConfigTest(unittest.TestCase):
    def test_project_requires_secret_password_and_sets_expected_defaults(self):
        source = Path("pulumi/postgres-apps/__main__.py").read_text()
        self.assertIn('postgres_password = config.require_secret("dbPassword")', source)
        self.assertIn('postgres_db = config.get("dbName") or "digao_oauth_portal"', source)
        self.assertIn('postgres_user = config.get("dbUser") or "postgres"', source)
        self.assertIn('name=f"postgres-apps-{stack}"', source)
        self.assertIn('name=f"postgres-apps-data-{stack}"', source)
        self.assertIn('docker.ContainerNetworksAdvancedArgs(name=npm_network)', source)


if __name__ == "__main__":
    unittest.main()
