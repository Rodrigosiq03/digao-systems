import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

portal_dir = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__), "..", "..", "clients", "web", "digao-oauth-portal"
    )
)

def cfg(key: str, default: str | None = None) -> str | None:
    return config.get(key) or default

image_tag = cfg("imageTag", stack)
http_port = int(cfg("httpPort", "8083"))
expose_port = (cfg("exposePort", "false") or "false").lower() == "true"

vite_kc_url = cfg("viteKcUrl", "http://localhost:8080")
vite_kc_realm = cfg("viteKcRealm", "digao-oauth-dev")
vite_kc_client_id = cfg("viteKcClientId", "digao-oauth-portal")
vite_api_url = cfg("viteApiUrl", "http://localhost:8081")

attach_npm = (cfg("attachToNpm", "true") or "true").lower() == "true"
npm_network = cfg("npmNetworkName", "npm_default")

image = docker.Image(
    "portal-image",
    image_name=f"docker.io/library/digao-oauth-portal:{image_tag}",
    skip_push=True,
    build=docker.DockerBuildArgs(
        context=portal_dir,
        dockerfile=os.path.join(portal_dir, "Dockerfile"),
        args={
            "VITE_KC_URL": vite_kc_url,
            "VITE_KC_REALM": vite_kc_realm,
            "VITE_KC_CLIENT_ID": vite_kc_client_id,
            "VITE_API_URL": vite_api_url,
        },
    ),
)

container_kwargs = dict(
    image=image.image_name,
    name=f"digao-oauth-portal-{stack}",
    restart="unless-stopped",
)

if attach_npm:
    container_kwargs["networks_advanced"] = [
        docker.ContainerNetworksAdvancedArgs(name=npm_network)
    ]

if expose_port:
    container_kwargs["ports"] = [
        docker.ContainerPortArgs(internal=80, external=http_port)
    ]

container = docker.Container("portal", **container_kwargs)

pulumi.export("httpPort", http_port)
pulumi.export("containerName", container.name)
