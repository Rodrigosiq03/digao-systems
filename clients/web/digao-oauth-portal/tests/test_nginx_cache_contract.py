from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class NginxCacheContractTest(unittest.TestCase):
    def test_nginx_disables_cache_for_shell_and_enables_it_for_hashed_assets(self):
        source = (ROOT / 'nginx.conf').read_text()
        self.assertIn('location = /index.html', source)
        self.assertIn('add_header Cache-Control "no-store, no-cache, must-revalidate"', source)
        self.assertIn('location /assets/', source)
        self.assertIn('add_header Cache-Control "public, max-age=31536000, immutable"', source)


if __name__ == '__main__':
    unittest.main()
