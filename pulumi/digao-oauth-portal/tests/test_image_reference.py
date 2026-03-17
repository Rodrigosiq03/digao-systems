from pathlib import Path
import unittest


class PortalImageReferenceTest(unittest.TestCase):
    def test_container_uses_repo_digest(self):
        source = Path(__file__).resolve().parents[1].joinpath('__main__.py').read_text()
        self.assertIn('image=image.repo_digest', source)
        self.assertNotIn('image=image.image_name', source)


if __name__ == '__main__':
    unittest.main()
