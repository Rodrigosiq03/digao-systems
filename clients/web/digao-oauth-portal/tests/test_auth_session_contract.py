from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AuthSessionContractTest(unittest.TestCase):
    def test_protected_api_client_exists_and_handles_refresh_retry(self):
        source = (ROOT / 'src' / 'infrastructure' / 'http' / 'protectedApiClient.ts').read_text()
        keycloak = (ROOT / 'src' / 'infrastructure' / 'auth' / 'keycloakClient.ts').read_text()
        store = (ROOT / 'src' / 'presentation' / 'stores' / 'authStore.ts').read_text()
        self.assertIn('createProtectedApiClient', source)
        self.assertIn('refreshPromise', source)
        self.assertIn('response.status === 401', source)
        self.assertIn('retry', source)
        self.assertIn('Sessão expirada. Faça login novamente.', source)
        self.assertIn('logout()', source)
        self.assertIn('updateToken(30)', keycloak)
        self.assertIn('initResult = null', keycloak)
        self.assertIn('keycloakInstance = null', keycloak)
        self.assertIn('authUseCases.logout()', store)

    def test_admin_and_authorization_clients_use_shared_protected_client(self):
        admin = (ROOT / 'src' / 'infrastructure' / 'admin' / 'adminApiClient.ts').read_text()
        authorization = (ROOT / 'src' / 'infrastructure' / 'authorization' / 'authorizationApiClient.ts').read_text()
        self.assertIn('createProtectedApiClient', admin)
        self.assertIn('createProtectedApiClient', authorization)
        self.assertNotIn('await auth.refresh()', admin)
        self.assertNotIn('await auth.refresh()', authorization)


if __name__ == '__main__':
    unittest.main()
