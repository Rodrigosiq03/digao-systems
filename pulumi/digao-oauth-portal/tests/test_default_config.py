from pathlib import Path
import unittest


class PortalDefaultConfigTest(unittest.TestCase):
    def test_dev_defaults_use_public_endpoints(self):
        source = Path(__file__).resolve().parents[1].joinpath('__main__.py').read_text()
        self.assertIn('KEYCLOAK_URL_BY_STACK = {', source)
        self.assertIn('"dev": "https://kc-dev.rodrigodsiqueira.dev.br:8443"', source)
        self.assertIn('"dev": "https://api-dev.rodrigodsiqueira.dev.br:8443"', source)
        self.assertIn('vite_kc_url = cfg("viteKcUrl", KEYCLOAK_URL_BY_STACK.get(stack, "http://localhost:8080"))', source)
        self.assertNotIn('vite_kc_url = cfg("viteKcUrl", "http://localhost:8080")', source)
        self.assertNotIn('"dev": "http://localhost:8081"', source)


if __name__ == '__main__':
    unittest.main()
