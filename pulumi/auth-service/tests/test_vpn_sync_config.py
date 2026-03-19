from pathlib import Path
import unittest


class AuthServiceVpnSyncConfigTest(unittest.TestCase):
    def test_auth_service_exposes_vpn_sync_runtime_envs(self):
        source = Path("pulumi/auth-service/__main__.py").read_text()
        self.assertIn('vpn_sync_enabled = config.get_bool("vpnSyncEnabled")', source)
        self.assertIn('vpn_sync_tailnet = config.get("vpnSyncTailnet")', source)
        self.assertIn('vpn_sync_api_token = config.get_secret("vpnSyncApiToken")', source)
        self.assertIn("VPN_SYNC_ENABLED=", source)
        self.assertIn("VPN_SYNC_TAILNET=", source)
        self.assertIn("VPN_SYNC_API_TOKEN=", source)

    def test_workflow_injects_vpn_sync_runtime_config(self):
        source = Path(".github/workflows/pulumi-services.yml").read_text()
        self.assertIn("AUTH_SERVICE_VPN_SYNC_ENABLED", source)
        self.assertIn("AUTH_SERVICE_VPN_SYNC_PROVIDER", source)
        self.assertIn("AUTH_SERVICE_VPN_SYNC_API_BASE_URL", source)
        self.assertIn("AUTH_SERVICE_VPN_SYNC_TAILNET", source)
        self.assertIn("AUTH_SERVICE_VPN_SYNC_API_TOKEN", source)
        self.assertIn('pulumi -C pulumi/auth-service config set auth-service:vpnSyncEnabled "${AUTH_SERVICE_VPN_SYNC_ENABLED:-false}"', source)
        self.assertIn('pulumi -C pulumi/auth-service config set auth-service:vpnSyncTailnet "$AUTH_SERVICE_VPN_SYNC_TAILNET"', source)
        self.assertIn('pulumi -C pulumi/auth-service config set --secret auth-service:vpnSyncApiToken "$AUTH_SERVICE_VPN_SYNC_API_TOKEN"', source)


if __name__ == "__main__":
    unittest.main()
