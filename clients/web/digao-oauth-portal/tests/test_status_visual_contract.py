from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class StatusVisualContractTest(unittest.TestCase):
    def test_user_cards_use_shared_status_badge(self):
        source = (ROOT / 'src' / 'presentation' / 'components' / 'userCards.tsx').read_text()
        self.assertIn('StatusBadge', source)

    def test_status_badge_component_exists(self):
        path = ROOT / 'src' / 'presentation' / 'components' / 'statusBadge.tsx'
        self.assertTrue(path.exists(), f'Missing status badge component: {path}')

    def test_topbar_uses_high_contrast_logout_treatment(self):
        source = (ROOT / 'src' / 'presentation' / 'components' / 'topbar.tsx').read_text()
        self.assertIn('logout', source.lower())
        self.assertIn('text-rose', source)


if __name__ == '__main__':
    unittest.main()
