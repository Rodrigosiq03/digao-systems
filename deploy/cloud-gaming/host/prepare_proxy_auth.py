#!/usr/bin/env python3
import argparse
import configparser
import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path


def load_secrets(path: Path) -> configparser.ConfigParser:
    parser = configparser.ConfigParser(interpolation=None)
    parser.optionxform = str
    parser.read(path)
    return parser


def post_form(url: str, form: dict[str, str]) -> dict:
    payload = urllib.parse.urlencode(form).encode("utf-8")
    request = urllib.request.Request(url, method="POST", data=payload)
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def request_json(method: str, url: str, headers=None, data=None):
    request_headers = headers or {}
    payload = None
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        request_headers = {**request_headers, "Content-Type": "application/json"}
    request = urllib.request.Request(url, method=method, headers=request_headers, data=payload)
    with urllib.request.urlopen(request, timeout=15) as response:
        body = response.read()
        if not body:
            return None
        return json.loads(body.decode("utf-8"))


def wait_for_admin_token(base_url: str, admin_user: str, admin_password: str) -> str:
    token_url = f"{base_url.rstrip('/')}/realms/master/protocol/openid-connect/token"
    for _ in range(30):
        try:
            payload = post_form(
                token_url,
                {
                    "client_id": "admin-cli",
                    "username": admin_user,
                    "password": admin_password,
                    "grant_type": "password",
                },
            )
            return payload["access_token"]
        except Exception:
            time.sleep(2)
    raise SystemExit("failed to obtain keycloak admin token")


def merge_client_redirects(
    base_url: str,
    realm: str,
    client_id: str,
    client_secret: str,
    admin_user: str,
    admin_password: str,
    redirect_uri: str,
    web_origin: str,
) -> None:
    token = wait_for_admin_token(base_url, admin_user, admin_password)
    headers = {"Authorization": f"Bearer {token}"}
    clients_url = f"{base_url.rstrip('/')}/admin/realms/{realm}/clients"
    existing = request_json(
        "GET",
        f"{clients_url}?clientId={urllib.parse.quote(client_id)}",
        headers=headers,
    )

    if not existing:
        payload = {
            "clientId": client_id,
            "name": client_id,
            "protocol": "openid-connect",
            "enabled": True,
            "publicClient": False,
            "clientAuthenticatorType": "client-secret",
            "standardFlowEnabled": True,
            "implicitFlowEnabled": False,
            "directAccessGrantsEnabled": False,
            "serviceAccountsEnabled": False,
            "authorizationServicesEnabled": False,
            "fullScopeAllowed": True,
            "redirectUris": [redirect_uri],
            "webOrigins": [web_origin],
            "rootUrl": web_origin,
            "baseUrl": "/",
            "secret": client_secret,
        }
        request_json("POST", clients_url, headers=headers, data=payload)
        return

    client_uuid = existing[0]["id"]
    current = request_json("GET", f"{clients_url}/{client_uuid}", headers=headers)
    current["redirectUris"] = sorted(
        {*(current.get("redirectUris") or []), redirect_uri}
    )
    current["webOrigins"] = sorted({*(current.get("webOrigins") or []), web_origin})
    if not current.get("rootUrl"):
        current["rootUrl"] = web_origin
    if not current.get("baseUrl"):
        current["baseUrl"] = "/"
    current.pop("secret", None)
    request_json("PUT", f"{clients_url}/{client_uuid}", headers=headers, data=current)


def write_env(output_path: Path, values: dict[str, str]) -> None:
    output_path.write_text(
        "\n".join(f"{key}={value}" for key, value in values.items()) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--secrets-file", required=True)
    parser.add_argument("--env", choices=["dev", "homolog", "prod"], required=True)
    parser.add_argument("--cloud-host", required=True)
    parser.add_argument("--keycloak-admin-base-url", required=True)
    parser.add_argument("--keycloak-public-base-url", required=True)
    parser.add_argument("--client-id", default="")
    parser.add_argument("--realm", default="")
    parser.add_argument("--output", required=True)
    parser.add_argument("--upstream", default="http://digao-cloud-gaming-web:80")
    args = parser.parse_args()

    secrets = load_secrets(Path(args.secrets_file))
    shared = secrets["shared"]
    env_block = secrets[args.env]

    env_upper = args.env.upper()
    client_secret = env_block[f"OAUTH2_PROXY_CLIENT_SECRET_{env_upper}"]
    cookie_secret = env_block[f"OAUTH2_PROXY_COOKIE_SECRET_{env_upper}"]
    admin_user = shared["KEYCLOAK_ADMIN_USER"]
    admin_password = env_block[f"KEYCLOAK_ADMIN_PASS_{env_upper}"]

    realm = args.realm or f"digao-oauth-{args.env}"
    client_id = args.client_id or f"admin-ui-{args.env}"
    web_origin = args.cloud_host.rstrip("/")
    redirect_uri = f"{web_origin}/oauth2/callback"
    keycloak_base = args.keycloak_public_base_url.rstrip("/")

    merge_client_redirects(
        base_url=args.keycloak_admin_base_url,
        realm=realm,
        client_id=client_id,
        client_secret=client_secret,
        admin_user=admin_user,
        admin_password=admin_password,
        redirect_uri=redirect_uri,
        web_origin=web_origin,
    )

    values = {
        "OAUTH2_PROXY_HTTP_ADDRESS": "0.0.0.0:4180",
        "OAUTH2_PROXY_PROVIDER": "keycloak",
        "OAUTH2_PROXY_CLIENT_ID": client_id,
        "OAUTH2_PROXY_CLIENT_SECRET": client_secret,
        "OAUTH2_PROXY_COOKIE_SECRET": cookie_secret,
        "OAUTH2_PROXY_COOKIE_NAME": f"_oauth2_proxy_cloud_gaming_{args.env}".replace("-", "_"),
        "OAUTH2_PROXY_COOKIE_SECURE": "true",
        "OAUTH2_PROXY_COOKIE_SAMESITE": "lax",
        "OAUTH2_PROXY_EMAIL_DOMAINS": "*",
        "OAUTH2_PROXY_REVERSE_PROXY": "true",
        "OAUTH2_PROXY_SKIP_PROVIDER_BUTTON": "true",
        "OAUTH2_PROXY_PASS_USER_HEADERS": "true",
        "OAUTH2_PROXY_SET_XAUTHREQUEST": "true",
        "OAUTH2_PROXY_SCOPE": "openid profile email",
        "OAUTH2_PROXY_REDIRECT_URL": redirect_uri,
        "OAUTH2_PROXY_UPSTREAMS": args.upstream,
        "OAUTH2_PROXY_LOGIN_URL": f"{keycloak_base}/realms/{realm}/protocol/openid-connect/auth",
        "OAUTH2_PROXY_REDEEM_URL": f"{keycloak_base}/realms/{realm}/protocol/openid-connect/token",
        "OAUTH2_PROXY_PROFILE_URL": f"{keycloak_base}/realms/{realm}/protocol/openid-connect/userinfo",
        "OAUTH2_PROXY_VALIDATE_URL": f"{keycloak_base}/realms/{realm}/protocol/openid-connect/userinfo",
    }
    write_env(Path(args.output), values)


if __name__ == "__main__":
    main()
