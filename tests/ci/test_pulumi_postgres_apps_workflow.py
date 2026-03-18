from pathlib import Path
import unittest


class PulumiPostgresAppsWorkflowTest(unittest.TestCase):
    def test_workflow_deploys_postgres_apps_from_environment_secret(self):
        source = Path(".github/workflows/pulumi-postgres-apps.yml").read_text()
        self.assertIn('name: pulumi-postgres-apps', source)
        self.assertIn('"pulumi/postgres-apps/**"', source)
        self.assertIn('POSTGRES_APPS_DB_PASSWORD', source)
        self.assertIn(
            'pulumi config set --secret postgres-apps:dbPassword "$POSTGRES_APPS_DB_PASSWORD"',
            source,
        )
        self.assertIn('pulumi stack select "${{ steps.stack.outputs.value }}"', source)
        self.assertIn('pulumi up --yes', source)


if __name__ == "__main__":
    unittest.main()
