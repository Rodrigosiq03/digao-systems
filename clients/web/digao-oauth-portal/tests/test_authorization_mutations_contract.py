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
            'useDisableAuthorizationProfile',
            'useCreateAuthorizationCapability',
            'useDisableAuthorizationCapability',
            'useGrantAuthorizationProfileCapability',
            'useAssignAuthorizationUserProfile',
            'useRevokeAuthorizationUserProfile',
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

        page_expectations = {
            'ProfilesPage.tsx': 'Desativar perfil',
            'CapabilitiesPage.tsx': 'Desativar permissão',
            'AssignmentsPage.tsx': 'Revogar vínculo',
        }
        for filename, expected_text in page_expectations.items():
            source = (ROOT / 'src' / 'presentation' / 'pages' / filename).read_text()
            self.assertIn(expected_text, source)

    def test_system_form_is_vertical_and_linkage_uses_shared_accent_style(self):
        system_form = (ROOT / 'src' / 'presentation' / 'forms' / 'systemForm.tsx').read_text()
        self.assertIn("className=\"grid gap-4\"", system_form)
        self.assertNotIn('md:grid-cols', system_form)

        accent_helper = ROOT / 'src' / 'presentation' / 'components' / 'accentActionButtonClass.ts'
        self.assertTrue(accent_helper.exists(), f'Missing accent helper: {accent_helper}')
        accent_source = accent_helper.read_text()
        self.assertIn('c7a65a', accent_source)
        self.assertIn('bg-[linear-gradient', accent_source)

        assignment_form = (ROOT / 'src' / 'presentation' / 'forms' / 'userProfileAssignmentForm.tsx').read_text()
        self.assertIn('accentActionButtonClass', assignment_form)

        profiles_page = (ROOT / 'src' / 'presentation' / 'pages' / 'ProfilesPage.tsx').read_text()
        self.assertIn('accentActionButtonClass', profiles_page)


if __name__ == '__main__':
    unittest.main()
