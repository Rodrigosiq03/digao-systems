from pathlib import Path
import unittest


WORKFLOW = Path(__file__).resolve().parents[2] / ".github" / "workflows" / "pulumi-services.yml"


class PulumiServicesWorkflowContractTest(unittest.TestCase):
    def test_workflow_uses_dynamic_matrix(self):
        source = WORKFLOW.read_text()
        self.assertIn("matrix: ${{ steps.matrix.outputs.matrix }}", source)
        self.assertIn("has_changes: ${{ steps.matrix.outputs.has_changes }}", source)
        self.assertIn("matrix: ${{ fromJson(needs.changes.outputs.matrix) }}", source)
        self.assertNotIn("Skip non-target service", source)
        self.assertNotIn("matrix:\n        include:", source)

    def test_workflow_does_not_trigger_on_apply_secrets_helper(self):
        source = WORKFLOW.read_text()
        self.assertNotIn('      - "pulumi/scripts/apply-secrets.py"', source)

    def test_auth_runtime_config_requires_authorization_db_envs(self):
        source = WORKFLOW.read_text()
        self.assertIn("AUTH_SERVICE_AUTHORIZATION_DB_JDBC_URL", source)
        self.assertIn("AUTH_SERVICE_AUTHORIZATION_DB_USER", source)
        self.assertIn("AUTH_SERVICE_AUTHORIZATION_DB_PASSWORD", source)


if __name__ == "__main__":
    unittest.main()
