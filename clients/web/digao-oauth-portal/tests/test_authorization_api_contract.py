from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AuthorizationApiContractTest(unittest.TestCase):
    def test_authorization_files_exist(self):
        expected = [
            ROOT / 'src' / 'domain' / 'authorization.ts',
            ROOT / 'src' / 'application' / 'authorization' / 'authorizationPort.ts',
            ROOT / 'src' / 'application' / 'authorization' / 'authorizationUseCases.ts',
            ROOT / 'src' / 'infrastructure' / 'authorization' / 'authorizationApiClient.ts',
        ]
        for path in expected:
            self.assertTrue(path.exists(), f'Missing file: {path}')

    def test_authorization_port_exposes_admin_methods(self):
        source = (ROOT / 'src' / 'application' / 'authorization' / 'authorizationPort.ts').read_text()
        expected_methods = [
            'listSystems',
            'createSystem',
            'listCapabilities',
            'createCapability',
            'listProfiles',
            'createProfile',
            'grantProfileCapability',
            'listUserProfiles',
            'assignUserProfile',
            'listAuditLogs',
            'getMyAccess',
        ]
        for method in expected_methods:
            self.assertIn(method, source)

    def test_authorization_client_implements_contract(self):
        source = (ROOT / 'src' / 'infrastructure' / 'authorization' / 'authorizationApiClient.ts').read_text()
        expected_paths = [
            '/admin/systems',
            '/admin/capabilities',
            '/admin/profiles',
            '/admin/profile-capabilities',
            '/admin/user-profiles',
            '/admin/audit-logs',
            '/me/access',
        ]
        for path in expected_paths:
            self.assertIn(path, source)


if __name__ == '__main__':
    unittest.main()
