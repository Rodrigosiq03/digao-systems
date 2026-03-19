from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AuthorizationPagesContractTest(unittest.TestCase):
    def test_authorization_hook_exists(self):
        hook = ROOT / 'src' / 'presentation' / 'hooks' / 'useAuthorizationData.ts'
        self.assertTrue(hook.exists(), f'Missing hook: {hook}')

    def test_pages_use_authorization_hook(self):
        expected = {
            'SystemsPage.tsx': 'useAuthorizationSystems',
            'ProfilesPage.tsx': 'useAuthorizationProfiles',
            'CapabilitiesPage.tsx': 'useAuthorizationCapabilities',
            'AssignmentsPage.tsx': 'useAuthorizationAssignments',
            'AuditPage.tsx': 'useAuthorizationAuditLogs',
        }
        for filename, hook_name in expected.items():
            source = (ROOT / 'src' / 'presentation' / 'pages' / filename).read_text()
            self.assertIn(hook_name, source)

    def test_pages_expose_read_only_copy(self):
        for filename in ['SystemsPage.tsx', 'ProfilesPage.tsx', 'CapabilitiesPage.tsx', 'AssignmentsPage.tsx', 'AuditPage.tsx']:
            source = (ROOT / 'src' / 'presentation' / 'pages' / filename).read_text()
            self.assertIn('Somente leitura', source)

    def test_capabilities_page_uses_permissions_wording(self):
        source = (ROOT / 'src' / 'presentation' / 'pages' / 'CapabilitiesPage.tsx').read_text()
        self.assertIn('Permissões', source)

    def test_audit_page_uses_humanized_timeline_fields(self):
        source = (ROOT / 'src' / 'presentation' / 'pages' / 'AuditPage.tsx').read_text()
        self.assertIn('createdAt', source)
        self.assertIn('actorEmail', source)
        self.assertIn('VPN', source)
        self.assertIn('Permissões', source)
        self.assertIn('Sistemas', source)


if __name__ == '__main__':
    unittest.main()
