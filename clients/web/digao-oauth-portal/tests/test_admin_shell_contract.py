from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AdminShellContractTest(unittest.TestCase):
    def test_portal_has_favicon_asset(self):
        self.assertTrue((ROOT / 'public' / 'favicon.svg').exists())
        index_source = (ROOT / 'index.html').read_text()
        self.assertIn('favicon.svg', index_source)

    def test_sidebar_supports_collapsed_state(self):
        nav_source = (ROOT / 'src' / 'presentation' / 'stores' / 'navStore.ts').read_text()
        sidebar_source = (ROOT / 'src' / 'presentation' / 'components' / 'sidebar.tsx').read_text()
        shell_source = (ROOT / 'src' / 'presentation' / 'pages' / 'AppShell.tsx').read_text()

        self.assertIn('collapsed', nav_source)
        self.assertIn('toggleCollapsed', nav_source)
        self.assertIn('toggleCollapsed', sidebar_source)
        self.assertIn('lg:grid-cols-[104px_minmax(0,1fr)]', shell_source)
        self.assertIn('lg:px-4', sidebar_source)

    def test_users_use_shared_user_form_and_update_flow(self):
        user_form = ROOT / 'src' / 'presentation' / 'forms' / 'userForm.tsx'
        page_source = (ROOT / 'src' / 'presentation' / 'pages' / 'UsersPage.tsx').read_text()
        client_source = (ROOT / 'src' / 'infrastructure' / 'admin' / 'adminApiClient.ts').read_text()
        hook_source = (ROOT / 'src' / 'presentation' / 'hooks' / 'useAdminData.ts').read_text()
        cards_source = (ROOT / 'src' / 'presentation' / 'components' / 'userCards.tsx').read_text()

        self.assertTrue(user_form.exists(), f'Missing form: {user_form}')
        self.assertIn('UserForm', page_source)
        self.assertNotIn('CreateUserForm', page_source)
        self.assertIn('updateUser', client_source)
        self.assertIn('useUpdateUser', hook_source)
        self.assertIn('Editar', cards_source)
        self.assertIn('Gerenciar acessos', cards_source)


if __name__ == '__main__':
    unittest.main()
