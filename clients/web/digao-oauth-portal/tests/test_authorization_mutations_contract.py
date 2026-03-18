from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AuthorizationMutationsContractTest(unittest.TestCase):
    def test_mutation_forms_exist(self):
        expected = [
            ROOT / 'src' / 'presentation' / 'forms' / 'systemForm.tsx',
            ROOT / 'src' / 'presentation' / 'forms' / 'profileForm.tsx',
            ROOT / 'src' / 'presentation' / 'forms' / 'capabilityForm.tsx',
            ROOT / 'src' / 'presentation' / 'forms' / 'userProfileAssignmentForm.tsx',
        ]
        for path in expected:
            self.assertTrue(path.exists(), f'Missing form: {path}')

    def test_authorization_hook_exposes_mutations(self):
        source = (ROOT / 'src' / 'presentation' / 'hooks' / 'useAuthorizationData.ts').read_text()
        for hook_name in [
            'useCreateAuthorizationSystem',
            'useDisableAuthorizationSystem',
            'useCreateAuthorizationProfile',
            'useCreateAuthorizationCapability',
            'useGrantAuthorizationProfileCapability',
            'useAssignAuthorizationUserProfile',
        ]:
            self.assertIn(hook_name, source)

    def test_pages_reference_admin_master_forms(self):
        expectations = {
            'SystemsPage.tsx': 'SystemForm',
            'ProfilesPage.tsx': 'ProfileForm',
            'CapabilitiesPage.tsx': 'CapabilityForm',
            'AssignmentsPage.tsx': 'UserProfileAssignmentForm',
        }
        for filename, component in expectations.items():
            source = (ROOT / 'src' / 'presentation' / 'pages' / filename).read_text()
            self.assertIn(component, source)
            self.assertIn('ADMIN_MASTER', source)


if __name__ == '__main__':
    unittest.main()
