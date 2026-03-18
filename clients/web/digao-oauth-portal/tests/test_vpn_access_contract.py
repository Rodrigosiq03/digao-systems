from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class VpnAccessContractTest(unittest.TestCase):
    def test_admin_contract_exposes_vpn_access(self):
        port_source = (ROOT / 'src' / 'application' / 'admin' / 'adminPort.ts').read_text()
        client_source = (ROOT / 'src' / 'infrastructure' / 'admin' / 'adminApiClient.ts').read_text()
        hook_source = (ROOT / 'src' / 'presentation' / 'hooks' / 'useAdminData.ts').read_text()

        self.assertIn('listUserVpnAccess', port_source)
        self.assertIn('upsertUserVpnAccess', port_source)
        self.assertIn('/admin/users/${userId}/vpn-access', client_source)
        self.assertIn('useAdminUserVpnAccess', hook_source)
        self.assertIn('useUpsertUserVpnAccess', hook_source)

    def test_users_module_renders_vpn_access_controls(self):
        form_path = ROOT / 'src' / 'presentation' / 'forms' / 'userVpnAccessForm.tsx'
        cards_source = (ROOT / 'src' / 'presentation' / 'components' / 'userCards.tsx').read_text()
        page_source = (ROOT / 'src' / 'presentation' / 'pages' / 'UsersPage.tsx').read_text()
        domain_source = (ROOT / 'src' / 'domain' / 'admin.ts').read_text()

        self.assertTrue(form_path.exists(), f'Missing form: {form_path}')
        self.assertIn('AdminUserVpnAccess', domain_source)
        self.assertIn('Status VPN', cards_source)
        self.assertIn('Abrir invite VPN', cards_source)
        self.assertIn('UserVpnAccessForm', page_source)
        self.assertIn('useAdminUserVpnAccess', cards_source)
        self.assertIn('useUpsertUserVpnAccess', page_source)
        self.assertIn('ADMIN_MASTER', page_source)


if __name__ == '__main__':
    unittest.main()
