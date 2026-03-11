#!/usr/bin/env python3
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def request_json(method: str, url: str, headers=None, data=None):
    payload = None
    req_headers = headers or {}
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        req_headers = {**req_headers, "Content-Type": "application/json"}
    req = urllib.request.Request(url, method=method, headers=req_headers, data=payload)
    with urllib.request.urlopen(req, timeout=15) as response:
        body = response.read()
        if not body:
            return None
        return json.loads(body.decode("utf-8"))


def post_form(url: str, form: dict[str, str]):
    data = urllib.parse.urlencode(form).encode("utf-8")
    req = urllib.request.Request(url, method="POST", data=data)
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def wait_for_admin_token(base_url: str, admin_user: str, admin_password: str) -> str:
    token_url = (
        f"{base_url}/realms/master/protocol/openid-connect/token"
    )
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
    raise SystemExit("Failed to obtain Keycloak admin token after retries.")


def main() -> None:
    base_url = env("KEYCLOAK_BASE_URL").rstrip("/")
    realm = env("KEYCLOAK_REALM")
    admin_user = env("KEYCLOAK_ADMIN_USER")
    admin_password = env("KEYCLOAK_ADMIN_PASSWORD")
    client_id = env("OIDC_CLIENT_ID")
    client_secret = env("OIDC_CLIENT_SECRET")
    redirect_uris = json.loads(env("OIDC_REDIRECT_URIS_JSON"))
    web_origins = json.loads(env("OIDC_WEB_ORIGINS_JSON"))

    token = wait_for_admin_token(base_url, admin_user, admin_password)
    headers = {"Authorization": f"Bearer {token}"}

    clients_url = f"{base_url}/admin/realms/{realm}/clients"
    existing = request_json(
        "GET",
        f"{clients_url}?clientId={urllib.parse.quote(client_id)}",
        headers=headers,
    )

    client_payload = {
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
        "redirectUris": redirect_uris,
        "webOrigins": web_origins,
        "rootUrl": web_origins[0] if web_origins else "",
        "baseUrl": "/",
        "secret": client_secret,
    }

    if existing:
        client_uuid = existing[0]["id"]
        # Updating the secret of an existing client is not supported in a stable way
        # through the Admin REST API. Preserve the existing secret and only reconcile
        # the OIDC settings we need for oauth2-proxy.
        request_json(
            "PUT",
            f"{clients_url}/{client_uuid}",
            headers=headers,
            data={k: v for k, v in client_payload.items() if k != "secret"},
        )
        print(f"Updated existing Keycloak client {client_id} ({client_uuid})")
        return

    try:
        request_json("POST", clients_url, headers=headers, data=client_payload)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(
            f"Failed to create Keycloak client {client_id}: {exc.code} {detail}"
        ) from exc

    print(f"Created Keycloak client {client_id}")


if __name__ == "__main__":
    main()
