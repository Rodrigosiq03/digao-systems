from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class StatusVisualContractTest(unittest.TestCase):
    def test_light_theme_tokens_are_not_too_faint(self):
        source = (ROOT / 'src' / 'index.css').read_text()
        self.assertIn('--muted: #4b5563;', source)
        self.assertIn('--border: rgba(43,58,85,.24);', source)

    def test_user_cards_use_shared_status_badge(self):
        source = (ROOT / 'src' / 'presentation' / 'components' / 'userCards.tsx').read_text()
        self.assertIn('StatusBadge', source)
        self.assertIn('bg-[color:var(--soft-panel)]', source)

    def test_status_badge_component_exists(self):
        path = ROOT / 'src' / 'presentation' / 'components' / 'statusBadge.tsx'
        self.assertTrue(path.exists(), f'Missing status badge component: {path}')
        source = path.read_text()
        self.assertIn('dark:', source)
        self.assertIn('text-emerald-700', source)
        self.assertIn('text-rose-700', source)

    def test_topbar_uses_high_contrast_logout_treatment(self):
        source = (ROOT / 'src' / 'presentation' / 'components' / 'topbar.tsx').read_text()
        self.assertIn('logout', source.lower())
        self.assertIn('text-rose', source)

    def test_sidebar_and_home_use_visible_light_mode_support_surfaces(self):
        sidebar = (ROOT / 'src' / 'presentation' / 'components' / 'sidebar.tsx').read_text()
        self.assertIn('dark:bg-[linear-gradient', sidebar)
        self.assertIn('text-slate-600', sidebar)

        home = (ROOT / 'src' / 'presentation' / 'pages' / 'HomePage.tsx').read_text()
        self.assertIn('Badge', home)
        self.assertIn('text-slate-600', home)

        badge = (ROOT / 'src' / 'components' / 'ui' / 'badge.tsx').read_text()
        self.assertIn('border-[rgba(43,58,85,0.14)]', badge)
        self.assertIn('bg-[rgba(43,58,85,0.06)]', badge)

    def test_public_landing_uses_digao_brand_and_light_mode_support_copy(self):
        shell = (ROOT / 'src' / 'presentation' / 'pages' / 'AppShell.tsx').read_text()
        self.assertIn('Digão Systems', shell)
        self.assertIn('gate-subtitle', shell)

        auth_panel = (ROOT / 'src' / 'presentation' / 'components' / 'authPanel.tsx').read_text()
        self.assertIn('text-slate-600', auth_panel)
        self.assertIn('Entrar com DigãoOAuth', auth_panel)

        hero = (ROOT / 'src' / 'presentation' / 'components' / 'heroSection.tsx').read_text()
        self.assertIn('text-slate-600', hero)
        self.assertIn('text-slate-950', hero)

        features = (ROOT / 'src' / 'presentation' / 'components' / 'featureGrid.tsx').read_text()
        self.assertIn('bg-[color:var(--soft-panel)]', features)

    def test_admin_pages_use_stronger_light_mode_support_copy(self):
        for relative_path in [
            ('src', 'presentation', 'pages', 'SystemsPage.tsx'),
            ('src', 'presentation', 'pages', 'ProfilesPage.tsx'),
            ('src', 'presentation', 'pages', 'CapabilitiesPage.tsx'),
            ('src', 'presentation', 'pages', 'AssignmentsPage.tsx'),
            ('src', 'presentation', 'pages', 'AuditPage.tsx'),
            ('src', 'presentation', 'pages', 'UsersPage.tsx'),
        ]:
            source = (ROOT.joinpath(*relative_path)).read_text()
            self.assertIn('text-slate-600', source)

        audit = (ROOT / 'src' / 'presentation' / 'pages' / 'AuditPage.tsx').read_text()
        self.assertIn('text-slate-700', audit)


if __name__ == '__main__':
    unittest.main()
