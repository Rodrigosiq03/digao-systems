import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

NETWORK_BY_STACK = {
    "dev": "npm_dev",
    "homolog": "npm_homolog",
    "prod": "npm_prod",
}

image_tag = config.get("imageTag") or "15"
postgres_db = config.get("dbName") or "digao_oauth_portal"
postgres_user = config.get("dbUser") or "postgres"
postgres_password = config.require_secret("dbPassword")
attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or NETWORK_BY_STACK.get(stack, "npm_default")

volume = docker.Volume(
    "postgres-apps-data",
    name=f"postgres-apps-data-{stack}",
)

container_kwargs = dict(
    image=docker.RemoteImage("postgres-apps-image", name=f"postgres:{image_tag}").name,
    name=f"postgres-apps-{stack}",
    restart="unless-stopped",
    envs=[
        f"POSTGRES_DB={postgres_db}",
        f"POSTGRES_USER={postgres_user}",
        pulumi.Output.concat("POSTGRES_PASSWORD=", postgres_password),
    ],
    volumes=[
        docker.ContainerVolumeArgs(
            volume_name=volume.name,
            container_path="/var/lib/postgresql/data",
        )
    ],
)

if attach_npm:
    container_kwargs["networks_advanced"] = [
        docker.ContainerNetworksAdvancedArgs(name=npm_network)
    ]

container = docker.Container("postgres-apps", **container_kwargs)

pulumi.export("containerName", container.name)
pulumi.export("databaseName", postgres_db)
pulumi.export("databaseUser", postgres_user)
pulumi.export("jdbcUrl", pulumi.Output.concat("jdbc:postgresql://", container.name, ":5432/", postgres_db))
