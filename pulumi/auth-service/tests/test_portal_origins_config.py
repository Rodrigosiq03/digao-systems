from pathlib import Path
import unittest


class AuthServicePortalOriginsConfigTest(unittest.TestCase):
    def test_auth_service_reads_portal_origins_from_config(self):
        source = Path('pulumi/auth-service/__main__.py').read_text()
        self.assertIn('portal_origins = config.require("portalOrigins")', source)
        self.assertIn('issuer_url = config.require("issuerUrl")', source)
        self.assertIn('DIGAO_PORTAL_ORIGINS=', source)

    def test_workflow_renders_auth_stack_config(self):
        source = Path('.github/workflows/pulumi-services.yml').read_text()
        self.assertIn('AUTH_SERVICE_PORTAL_ORIGINS', source)
        self.assertIn('AUTH_SERVICE_ISSUER_URL', source)
        self.assertIn('pulumi -C pulumi/auth-service config set auth-service:portalOrigins "$AUTH_SERVICE_PORTAL_ORIGINS"', source)
        self.assertIn('pulumi -C pulumi/auth-service config set auth-service:issuerUrl "$AUTH_SERVICE_ISSUER_URL"', source)
        self.assertIn('environment:', source)


if __name__ == '__main__':
    unittest.main()
