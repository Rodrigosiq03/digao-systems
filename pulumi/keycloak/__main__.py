import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

image_tag = config.get("imageTag") or "26.0.8"
db_image_tag = config.get("dbImageTag") or "15"

start_mode = (config.get("startMode") or "prod").lower()
command = ["start-dev"] if start_mode == "dev" else ["start"]

http_port = int(config.get("httpPort") or 8080)
expose_port = (config.get("exposePort") or "true").lower() == "true"

admin_user = config.get("adminUser") or "keycloak"
admin_password = config.require_secret("adminPassword")

postgres_user = config.get("dbUser") or "postgres"
postgres_password = config.require_secret("dbPassword")
postgres_db = config.get("dbName") or "keycloak"

proxy_mode = config.get("proxy") or "edge"
http_enabled = (config.get("httpEnabled") or "true").lower()
hostname = config.get("hostname")
hostname_strict = config.get("hostnameStrict")

attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or "npm_default"

themes_path = config.get("themesPath")
spi_jar_path = config.get("spiJarPath")
import_path = config.get("importPath")
import_realm = (config.get("importRealm") or "false").lower() == "true"

email_template_provider = config.get("emailTemplateProvider")
if not email_template_provider:
    email_template_provider = "rabbitmq" if spi_jar_path else "freemarker"

rabbit_host = config.get("rabbitHost") or f"rabbitmq-{stack}"
rabbit_port = int(config.get("rabbitPort") or 5672)
rabbit_user = config.get("rabbitUser") or stack
rabbit_vhost = config.get("rabbitVhost") or f"/{stack}"
rabbit_ssl = (config.get("rabbitSsl") or "false").lower()
rabbit_exchange = config.get("rabbitExchange") or "notification.exchange"
rabbit_routing_key = config.get("rabbitRoutingKey") or "digao.notification.email.send"
rabbit_connection_timeout_ms = int(config.get("rabbitConnectionTimeoutMs") or 10000)
rabbit_password = config.require_secret("rabbitPassword") if email_template_provider == "rabbitmq" else None

network = docker.Network(
    "keycloak-net",
    name=f"keycloak-net-{stack}",
    driver="bridge",
)

pg_volume = docker.Volume("keycloak-db", name=f"keycloak-db-{stack}")
keycloak_data = docker.Volume("keycloak-data", name=f"keycloak-data-{stack}")

postgres = docker.Container(
    "keycloak-postgres",
    image=docker.RemoteImage("postgres-image", name=f"postgres:{db_image_tag}").name,
    name=f"keycloak-db-{stack}",
    restart="unless-stopped",
    envs=[
        f"POSTGRES_DB={postgres_db}",
        f"POSTGRES_USER={postgres_user}",
        pulumi.Output.concat("POSTGRES_PASSWORD=", postgres_password),
    ],
    networks_advanced=[
        docker.ContainerNetworksAdvancedArgs(name=network.name),
    ],
    volumes=[
        docker.ContainerVolumeArgs(
            volume_name=pg_volume.name,
            container_path="/var/lib/postgresql/data",
        )
    ],
)

envs = [
    "KC_DB=postgres",
    f"KC_DB_URL=jdbc:postgresql://keycloak-db-{stack}:5432/{postgres_db}",
    f"KC_DB_USERNAME={postgres_user}",
    pulumi.Output.concat("KC_DB_PASSWORD=", postgres_password),
    f"KEYCLOAK_ADMIN={admin_user}",
    pulumi.Output.concat("KEYCLOAK_ADMIN_PASSWORD=", admin_password),
    f"KC_PROXY={proxy_mode}",
    f"KC_HTTP_ENABLED={http_enabled}",
    "KC_HEALTH_ENABLED=true",
    "KC_METRICS_ENABLED=true",
    f"KC_SPI_EMAIL_TEMPLATE_PROVIDER={email_template_provider}",
]

if hostname:
    envs.append(f"KC_HOSTNAME={hostname}")
if hostname_strict is not None:
    envs.append(f"KC_HOSTNAME_STRICT={hostname_strict}")

if email_template_provider == "rabbitmq":
    envs.extend(
        [
            f"KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_HOST={rabbit_host}",
            f"KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_PORT={rabbit_port}",
            f"KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_USERNAME={rabbit_user}",
            pulumi.Output.concat("KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_PASSWORD=", rabbit_password),
            f"KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_VIRTUAL_HOST={rabbit_vhost}",
            f"KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_SSL={rabbit_ssl}",
            f"KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_EXCHANGE={rabbit_exchange}",
            f"KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_ROUTING_KEY={rabbit_routing_key}",
            f"KC_SPI_EMAIL_TEMPLATE_RABBITMQ_RABBIT_CONNECTION_TIMEOUT_MS={rabbit_connection_timeout_ms}",
        ]
    )

volumes = [
    docker.ContainerVolumeArgs(
        volume_name=keycloak_data.name,
        container_path="/opt/keycloak/data",
    )
]

if themes_path:
    volumes.append(
        docker.ContainerVolumeArgs(
            host_path=themes_path,
            container_path="/opt/keycloak/themes",
            read_only=True,
        )
    )

if spi_jar_path:
    jar_name = os.path.basename(spi_jar_path)
    volumes.append(
        docker.ContainerVolumeArgs(
            host_path=spi_jar_path,
            container_path=f"/opt/keycloak/providers/{jar_name}",
            read_only=True,
        )
    )

if import_path:
    volumes.append(
        docker.ContainerVolumeArgs(
            host_path=import_path,
            container_path="/opt/keycloak/data/import",
            read_only=True,
        )
    )

if import_realm:
    command.append("--import-realm")

networks_advanced = [docker.ContainerNetworksAdvancedArgs(name=network.name)]
if attach_npm:
    networks_advanced.append(docker.ContainerNetworksAdvancedArgs(name=npm_network))

container_kwargs = dict(
    image=docker.RemoteImage("keycloak-image", name=f"quay.io/keycloak/keycloak:{image_tag}").name,
    name=f"keycloak-{stack}",
    restart="unless-stopped",
    command=command,
    envs=envs,
    networks_advanced=networks_advanced,
    volumes=volumes,
    opts=pulumi.ResourceOptions(depends_on=[postgres]),
)

if expose_port:
    container_kwargs["ports"] = [docker.ContainerPortArgs(internal=8080, external=http_port)]

keycloak = docker.Container("keycloak", **container_kwargs)

pulumi.export("httpPort", http_port)
pulumi.export("containerName", keycloak.name)
pulumi.export("dbContainerName", postgres.name)
