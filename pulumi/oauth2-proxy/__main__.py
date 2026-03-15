import json
import os

import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

REALM_BY_STACK = {
    "dev": "digao-oauth-dev",
    "homolog": "digao-oauth-hml",
    "prod": "digao-oauth-prod",
}
DEV_NETWORK_BY_STACK = {
    "dev": "npm_dev",
    "homolog": "npm_homolog",
    "prod": "npm_prod",
}
PROD_NETWORK_NAME = "npm_prod"
PUBLIC_BASE_BY_STACK = {
    "dev": "https://kc-dev.rodrigodsiqueira.dev.br:8443",
    "homolog": "https://kc-hml.rodrigodsiqueira.dev.br:8444",
}
SERVICE_BASES = {
    "dev": {
        "grafana": ("https://grafana-dev.rodrigodsiqueira.dev.br:8443", "http://grafana-dev:3000"),
        "metrics": ("https://metrics-dev.rodrigodsiqueira.dev.br:8443", "http://prometheus-dev:9090"),
    },
    "homolog": {
        "grafana": ("https://grafana-hml.rodrigodsiqueira.dev.br:8444", "http://grafana-homolog:3000"),
        "metrics": ("https://metrics-hml.rodrigodsiqueira.dev.br:8444", "http://prometheus-homolog:9090"),
    },
}
PORTAINER_HOST = "https://portainer.rodrigodsiqueira.dev.br"
PORTAINER_UPSTREAM = "http://portainer-shared:9000"

image_tag = config.get("imageTag") or "v7.7.1"
keycloak_realm = config.get("keycloakRealm") or REALM_BY_STACK.get(stack, f"digao-oauth-{stack}")
keycloak_admin_base_url = config.get("keycloakAdminBaseUrl") or f"http://keycloak-{stack}:8080"
public_base = PUBLIC_BASE_BY_STACK.get(stack)
keycloak_login_url = config.get("keycloakLoginUrl") or (f"{public_base}/realms/{keycloak_realm}/protocol/openid-connect/auth" if public_base else None)
keycloak_redeem_url = config.get("keycloakRedeemUrl") or (f"{public_base}/realms/{keycloak_realm}/protocol/openid-connect/token" if public_base else None)
keycloak_profile_url = config.get("keycloakProfileUrl") or (f"{public_base}/realms/{keycloak_realm}/protocol/openid-connect/userinfo" if public_base else None)
keycloak_validate_url = config.get("keycloakValidateUrl") or keycloak_profile_url
if not all([keycloak_login_url, keycloak_redeem_url, keycloak_profile_url, keycloak_validate_url]):
    raise Exception(f"oauth2-proxy URLs must be configured for stack {stack}")
keycloak_client_id = config.get("keycloakClientId") or f"admin-ui-{stack}"
keycloak_admin_user = config.require("keycloakAdminUser")
keycloak_admin_password = config.require_secret("keycloakAdminPassword")
keycloak_client_secret = config.require_secret("clientSecret")
cookie_secret = config.require_secret("cookieSecret")

dev_network_name = config.get("devNetworkName") or DEV_NETWORK_BY_STACK.get(stack, "npm_dev")
prod_network_name = config.get("prodNetworkName") or PROD_NETWORK_NAME

bootstrap_script = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "bootstrap_keycloak_client.py")
)

proxy_image = docker.RemoteImage(
    "oauth2-proxy-image",
    name=f"quay.io/oauth2-proxy/oauth2-proxy:{image_tag}",
)

bootstrap_image = docker.RemoteImage(
    "oauth2-proxy-bootstrap-image",
    name="python:3.12-alpine",
)

grafana_host, grafana_upstream = SERVICE_BASES.get(stack, {}).get("grafana", (config.get("grafanaHost"), config.get("grafanaUpstream")))
metrics_host, metrics_upstream = SERVICE_BASES.get(stack, {}).get("metrics", (config.get("metricsHost"), config.get("metricsUpstream")))
portainer_host = config.get("portainerHost") or PORTAINER_HOST
portainer_upstream = config.get("portainerUpstream") or PORTAINER_UPSTREAM
if not all([grafana_host, grafana_upstream, metrics_host, metrics_upstream, portainer_host, portainer_upstream]):
    raise Exception(f"oauth2-proxy target hosts/upstreams must be configured for stack {stack}")

targets = {
    "grafana": {
        "host": grafana_host,
        "upstream": grafana_upstream,
        "networks": [dev_network_name],
    },
    "metrics": {
        "host": metrics_host,
        "upstream": metrics_upstream,
        "networks": [dev_network_name],
    },
    "portainer": {
        "host": portainer_host,
        "upstream": portainer_upstream,
        "networks": [prod_network_name],
    },
}

redirect_uris = [f"{item['host'].rstrip('/')}/oauth2/callback" for item in targets.values()]
web_origins = sorted({item["host"].rstrip("/") for item in targets.values()})

bootstrap = docker.Container(
    "oauth2-proxy-keycloak-bootstrap",
    image=bootstrap_image.name,
    name=f"oauth2-proxy-keycloak-bootstrap-{stack}",
    must_run=False,
    restart="no",
    command=["python", "/app/bootstrap_keycloak_client.py"],
    envs=[
        f"KEYCLOAK_BASE_URL={keycloak_admin_base_url}",
        f"KEYCLOAK_REALM={keycloak_realm}",
        f"KEYCLOAK_ADMIN_USER={keycloak_admin_user}",
        pulumi.Output.concat("KEYCLOAK_ADMIN_PASSWORD=", keycloak_admin_password),
        f"OIDC_CLIENT_ID={keycloak_client_id}",
        pulumi.Output.concat("OIDC_CLIENT_SECRET=", keycloak_client_secret),
        f"OIDC_REDIRECT_URIS_JSON={json.dumps(redirect_uris)}",
        f"OIDC_WEB_ORIGINS_JSON={json.dumps(web_origins)}",
    ],
    networks_advanced=[docker.ContainerNetworksAdvancedArgs(name=dev_network_name)],
    volumes=[
        docker.ContainerVolumeArgs(
            host_path=bootstrap_script,
            container_path="/app/bootstrap_keycloak_client.py",
            read_only=True,
        )
    ],
)


def build_proxy(target_name: str, target: dict[str, list[str] | str]) -> docker.Container:
    cookie_name = f"_oauth2_proxy_{target_name}_{stack}".replace("-", "_")
    envs = [
        "OAUTH2_PROXY_HTTP_ADDRESS=0.0.0.0:4180",
        "OAUTH2_PROXY_PROVIDER=keycloak",
        f"OAUTH2_PROXY_CLIENT_ID={keycloak_client_id}",
        pulumi.Output.concat("OAUTH2_PROXY_CLIENT_SECRET=", keycloak_client_secret),
        pulumi.Output.concat("OAUTH2_PROXY_COOKIE_SECRET=", cookie_secret),
        f"OAUTH2_PROXY_COOKIE_NAME={cookie_name}",
        "OAUTH2_PROXY_COOKIE_SECURE=true",
        "OAUTH2_PROXY_COOKIE_SAMESITE=lax",
        "OAUTH2_PROXY_EMAIL_DOMAINS=*",
        "OAUTH2_PROXY_REVERSE_PROXY=true",
        "OAUTH2_PROXY_SKIP_PROVIDER_BUTTON=true",
        "OAUTH2_PROXY_PASS_USER_HEADERS=true",
        "OAUTH2_PROXY_SET_XAUTHREQUEST=true",
        "OAUTH2_PROXY_SCOPE=openid profile email",
        f"OAUTH2_PROXY_REDIRECT_URL={target['host'].rstrip('/')}/oauth2/callback",
        f"OAUTH2_PROXY_UPSTREAMS={target['upstream']}",
        f"OAUTH2_PROXY_LOGIN_URL={keycloak_login_url}",
        f"OAUTH2_PROXY_REDEEM_URL={keycloak_redeem_url}",
        f"OAUTH2_PROXY_PROFILE_URL={keycloak_profile_url}",
        f"OAUTH2_PROXY_VALIDATE_URL={keycloak_validate_url}",
    ]

    return docker.Container(
        f"oauth2-proxy-{target_name}",
        image=proxy_image.name,
        name=f"oauth2-proxy-{target_name}-{stack}",
        restart="unless-stopped",
        envs=envs,
        networks_advanced=[
            docker.ContainerNetworksAdvancedArgs(name=network_name)
            for network_name in target["networks"]
        ],
        opts=pulumi.ResourceOptions(depends_on=[bootstrap]),
    )


containers = {
    name: build_proxy(name, target)
    for name, target in targets.items()
}

pulumi.export(
    "containerNames",
    pulumi.Output.all(**{name: container.name for name, container in containers.items()}),
)
