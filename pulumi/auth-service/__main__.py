import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "services", "auth-service"))

image_tag = config.get("imageTag") or stack
http_port = int(config.get("httpPort") or 8091)

rabbit_host = config.get("rabbitHost") or f"rabbitmq-{stack}"
rabbit_user = config.get("rabbitUser") or stack
rabbit_password = config.require_secret("rabbitPassword")
rabbit_vhost = config.get("rabbitVhost") or f"/{stack}"

rabbit_exchange = config.get("rabbitExchange") or "notification.exchange"
rabbit_routing_key = config.get("rabbitRoutingKey") or "digao.auth.email.send"

keycloak_base_url = config.get("keycloakBaseUrl") or f"http://keycloak-{stack}:8080"
keycloak_realm = config.get("keycloakRealm") or f"digao-oauth-{stack}"
keycloak_admin_client_id = config.get("keycloakAdminClientId") or "digao-oauth-backend-admin"
keycloak_admin_client_secret = config.require_secret("keycloakAdminClientSecret")

issuer_url = config.get("issuerUrl") or f"{keycloak_base_url}/realms/{keycloak_realm}"

attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or "npm_default"

image = docker.Image(
    "auth-image",
    image_name=f"auth-service:{image_tag}",
    build=docker.DockerBuildArgs(context=service_dir, dockerfile="Dockerfile"),
)

envs = [
    f"RABBIT_HOST={rabbit_host}",
    f"RABBIT_USER={rabbit_user}",
    pulumi.Output.concat("RABBIT_PASS=", rabbit_password),
    f"SPRING_RABBITMQ_VIRTUAL_HOST={rabbit_vhost}",
    f"RABBIT_EXCHANGE={rabbit_exchange}",
    f"RABBIT_ROUTING_KEY={rabbit_routing_key}",
    f"KEYCLOAK_ADMIN_SERVER_URL={keycloak_base_url}",
    f"KEYCLOAK_ADMIN_REALM={keycloak_realm}",
    f"KEYCLOAK_ADMIN_CLIENT_ID={keycloak_admin_client_id}",
    pulumi.Output.concat("KEYCLOAK_ADMIN_CLIENT_SECRET=", keycloak_admin_client_secret),
    f"SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI={issuer_url}",
]

container_kwargs = dict(
    image=image.image_name,
    name=f"auth-{stack}",
    restart="unless-stopped",
    ports=[docker.ContainerPortArgs(internal=8081, external=http_port)],
    envs=envs,
)

if attach_npm:
    container_kwargs["networks_advanced"] = [
        docker.ContainerNetworksAdvancedArgs(name=npm_network)
    ]

container = docker.Container("auth", **container_kwargs)

pulumi.export("httpPort", http_port)
pulumi.export("containerName", container.name)
