from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PortalAuthConfigSourceTest(unittest.TestCase):
    def test_keycloak_client_has_no_browser_override(self):
        source = (ROOT / 'src' / 'infrastructure' / 'auth' / 'keycloakClient.ts').read_text()
        self.assertNotIn('CONFIG_KEY', source)
        self.assertNotIn('localStorage', source)
        self.assertNotIn('setConfig:', source)
        self.assertNotIn('http://localhost:8080', source)

    def test_auth_contract_has_no_set_config(self):
        port = (ROOT / 'src' / 'application' / 'auth' / 'authPort.ts').read_text()
        usecases = (ROOT / 'src' / 'application' / 'auth' / 'authUseCases.ts').read_text()
        store = (ROOT / 'src' / 'presentation' / 'stores' / 'authStore.ts').read_text()
        self.assertNotIn('setConfig', port)
        self.assertNotIn('setConfig', usecases)
        self.assertNotIn('setConfig', store)

    def test_admin_page_has_no_manual_keycloak_form(self):
        admin_page = (ROOT / 'src' / 'presentation' / 'pages' / 'AdminPage.tsx').read_text()
        self.assertNotIn('KeycloakConfigForm', admin_page)


if __name__ == '__main__':
    unittest.main()
