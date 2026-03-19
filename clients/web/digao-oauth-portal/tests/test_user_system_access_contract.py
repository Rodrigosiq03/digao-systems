from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class UserSystemAccessContractTest(unittest.TestCase):
    def test_users_page_exposes_system_first_access_copy(self):
        source = (ROOT / 'src' / 'presentation' / 'pages' / 'UsersPage.tsx').read_text()
        self.assertIn('Acessos por sistema', source)
        self.assertIn('Conceder acesso', source)
        self.assertIn('Trocar acesso', source)

    def test_users_page_uses_system_access_component(self):
        source = (ROOT / 'src' / 'presentation' / 'pages' / 'UsersPage.tsx').read_text()
        self.assertIn('UserSystemAccessSheet', source)
        self.assertIn('useUserSystemAccessView', source)

    def test_system_access_components_exist(self):
        expected = [
            ROOT / 'src' / 'presentation' / 'components' / 'userSystemAccessList.tsx',
            ROOT / 'src' / 'presentation' / 'components' / 'userSystemAccessSheet.tsx',
        ]
        for path in expected:
            self.assertTrue(path.exists(), f'Missing system access component: {path}')


if __name__ == '__main__':
    unittest.main()
