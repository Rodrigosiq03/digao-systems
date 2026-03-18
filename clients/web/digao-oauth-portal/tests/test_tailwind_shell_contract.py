from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class TailwindShellContractTest(unittest.TestCase):
    def test_index_css_does_not_own_admin_shell_selectors(self):
        css_source = (ROOT / "src" / "index.css").read_text()
        forbidden_selectors = [
            ".app-root",
            ".app-root-collapsed",
            ".app-sidebar",
            ".app-sidebar-collapsed",
            ".quick-actions-menu",
            ".admin-page-grid",
            ".admin-page-shell",
        ]

        for selector in forbidden_selectors:
            self.assertNotIn(selector, css_source, f"Global CSS still owns shell selector: {selector}")

    def test_shell_components_own_layout_markup(self):
        shell_source = (ROOT / "src" / "presentation" / "pages" / "AppShell.tsx").read_text()
        sidebar_source = (ROOT / "src" / "presentation" / "components" / "sidebar.tsx").read_text()
        menu_source = (ROOT / "src" / "presentation" / "components" / "quickActionsMenu.tsx").read_text()

        self.assertIn('lg:grid-cols-[280px_minmax(0,1fr)]', shell_source)
        self.assertIn('lg:grid-cols-[104px_minmax(0,1fr)]', shell_source)
        self.assertIn('lg:h-screen', sidebar_source)
        self.assertIn('min-w-[210px]', menu_source)


if __name__ == "__main__":
    unittest.main()
