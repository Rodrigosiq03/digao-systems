from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AuthorizationNavigationContractTest(unittest.TestCase):
    def test_authorization_page_shells_exist(self):
        expected = [
            ROOT / 'src' / 'presentation' / 'pages' / 'ProfilesPage.tsx',
            ROOT / 'src' / 'presentation' / 'pages' / 'CapabilitiesPage.tsx',
            ROOT / 'src' / 'presentation' / 'pages' / 'AssignmentsPage.tsx',
            ROOT / 'src' / 'presentation' / 'pages' / 'AuditPage.tsx',
        ]
        for path in expected:
            self.assertTrue(path.exists(), f'Missing page shell: {path}')

    def test_nav_store_knows_authorization_sections(self):
        source = (ROOT / 'src' / 'presentation' / 'stores' / 'navStore.ts').read_text()
        for section in ['profiles', 'capabilities', 'assignments', 'audit']:
            self.assertIn(section, source)

    def test_sidebar_and_appshell_gate_admin_sections_by_role(self):
        sidebar = (ROOT / 'src' / 'presentation' / 'components' / 'sidebar.tsx').read_text()
        app_shell = (ROOT / 'src' / 'presentation' / 'pages' / 'AppShell.tsx').read_text()
        for marker in ['ADMIN_MASTER', 'ADMIN', 'COMMON']:
            self.assertIn(marker, app_shell)
        for item in ['Perfis', 'Permissões', 'Acessos', 'Auditoria']:
            self.assertIn(item, sidebar)


if __name__ == '__main__':
    unittest.main()
