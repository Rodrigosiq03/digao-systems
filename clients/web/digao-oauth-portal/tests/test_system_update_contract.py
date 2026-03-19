from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class SystemUpdateContractTest(unittest.TestCase):
    def test_system_update_contract_is_exposed_across_layers(self):
        port = (ROOT / 'src' / 'application' / 'authorization' / 'authorizationPort.ts').read_text()
        usecases = (ROOT / 'src' / 'application' / 'authorization' / 'authorizationUseCases.ts').read_text()
        client = (ROOT / 'src' / 'infrastructure' / 'authorization' / 'authorizationApiClient.ts').read_text()
        hooks = (ROOT / 'src' / 'presentation' / 'hooks' / 'useAuthorizationData.ts').read_text()
        systems_page = (ROOT / 'src' / 'presentation' / 'pages' / 'SystemsPage.tsx').read_text()
        system_form = (ROOT / 'src' / 'presentation' / 'forms' / 'systemForm.tsx').read_text()

        self.assertIn('updateSystem', port)
        self.assertIn('updateSystem', usecases)
        self.assertIn('PUT', client)
        self.assertIn('/admin/systems/${systemId}', client)
        self.assertIn('useUpdateAuthorizationSystem', hooks)
        self.assertIn('Editar sistema', systems_page)
        self.assertIn('mode', system_form)
        self.assertIn('Salvar alterações', system_form)
        self.assertIn('key', system_form)


if __name__ == '__main__':
    unittest.main()
