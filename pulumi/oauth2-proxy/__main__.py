import json
import os
import urllib.parse

import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

image_tag = config.get("imageTag") or "v7.7.1"
keycloak_realm = config.get("keycloakRealm") or f"digao-oauth-{stack}"
keycloak_admin_base_url = config.get("keycloakAdminBaseUrl") or f"http://keycloak-{stack}:8080"
keycloak_login_url = config.require("keycloakLoginUrl")
keycloak_redeem_url = config.require("keycloakRedeemUrl")
keycloak_profile_url = config.require("keycloakProfileUrl")
keycloak_validate_url = config.require("keycloakValidateUrl")
keycloak_logout_url = config.require("keycloakLogoutUrl")
keycloak_client_id = config.get("keycloakClientId") or f"admin-ui-{stack}"
keycloak_admin_user = config.require("keycloakAdminUser")
keycloak_admin_password = config.require_secret("keycloakAdminPassword")
keycloak_client_secret = config.require_secret("clientSecret")
cookie_secret = config.require_secret("cookieSecret")
cookie_name = config.get("cookieName") or f"_oauth2_proxy_admin_{stack}"
cookie_domain = config.require("cookieDomain")
post_logout_redirect_url = config.require("postLogoutRedirectUrl")

dev_network_name = config.get("devNetworkName") or "npm_dev"
prod_network_name = config.get("prodNetworkName") or "npm_prod"

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

targets = {
    "grafana": {
        "host": config.require("grafanaHost"),
        "upstream": config.require("grafanaUpstream"),
        "networks": [dev_network_name],
    },
    "metrics": {
        "host": config.require("metricsHost"),
        "upstream": config.require("metricsUpstream"),
        "networks": [dev_network_name],
    },
}

redirect_uris = [f"{item['host'].rstrip('/')}/oauth2/callback" for item in targets.values()]
web_origins = sorted({item["host"].rstrip("/") for item in targets.values()})
logout_redirect = (
    f"{keycloak_logout_url}"
    f"?post_logout_redirect_uri={urllib.parse.quote(post_logout_redirect_url, safe='')}"
    f"&client_id={urllib.parse.quote(keycloak_client_id, safe='')}"
)

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
    envs = [
        "OAUTH2_PROXY_HTTP_ADDRESS=0.0.0.0:4180",
        "OAUTH2_PROXY_PROVIDER=keycloak",
        f"OAUTH2_PROXY_CLIENT_ID={keycloak_client_id}",
        pulumi.Output.concat("OAUTH2_PROXY_CLIENT_SECRET=", keycloak_client_secret),
        pulumi.Output.concat("OAUTH2_PROXY_COOKIE_SECRET=", cookie_secret),
        f"OAUTH2_PROXY_COOKIE_NAME={cookie_name}",
        f"OAUTH2_PROXY_COOKIE_DOMAINS={cookie_domain}",
        f"OAUTH2_PROXY_WHITELIST_DOMAINS={cookie_domain}",
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
pulumi.export(
    "logoutUrl",
    f"{targets['grafana']['host'].rstrip('/')}/oauth2/sign_out?rd={urllib.parse.quote(logout_redirect, safe='')}",
)
