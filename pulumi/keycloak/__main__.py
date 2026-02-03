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
]

if hostname:
    envs.append(f"KC_HOSTNAME={hostname}")
if hostname_strict is not None:
    envs.append(f"KC_HOSTNAME_STRICT={hostname_strict}")

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

keycloak = docker.Container(
    "keycloak",
    image=docker.RemoteImage("keycloak-image", name=f"quay.io/keycloak/keycloak:{image_tag}").name,
    name=f"keycloak-{stack}",
    restart="unless-stopped",
    command=command,
    envs=envs,
    ports=[docker.ContainerPortArgs(internal=8080, external=http_port)],
    networks_advanced=networks_advanced,
    volumes=volumes,
    opts=pulumi.ResourceOptions(depends_on=[postgres]),
)

pulumi.export("httpPort", http_port)
pulumi.export("containerName", keycloak.name)
pulumi.export("dbContainerName", postgres.name)
