import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

image_tag = config.get("imageTag") or "7.2"
redis_port = int(config.get("port") or 6379)

auth_enabled = (config.get("authEnabled") or "false").lower() == "true"
redis_user = config.get("redisUser") or "redis"
redis_password = config.get_secret("redisPassword")

appendonly = (config.get("appendOnly") or "yes").lower()

attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or "npm_default"

redis_conf_lines = [
    "protected-mode yes",
    f"appendonly {appendonly}",
]

redis_acl = None
if auth_enabled:
    if redis_password is None:
        raise Exception("redisPassword is required when authEnabled is true")
    redis_conf_lines.append("aclfile /usr/local/etc/redis/users.acl")
    redis_acl = pulumi.Output.concat(
        "user default off\n",
        f"user {redis_user} on >",
        redis_password,
        " ~* +@all\n",
    )

redis_conf = "\n".join(redis_conf_lines) + "\n"

image = docker.RemoteImage("redis-image", name=f"redis:{image_tag}")

entrypoint_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "entrypoint.sh"))

volume = docker.Volume("redis-data", name=f"redis-data-{stack}")

container_kwargs = dict(
    image=image.name,
    name=f"redis-{stack}",
    restart="unless-stopped",
    command=["/bin/sh", "-c", "/entrypoint.sh"],
    ports=[docker.ContainerPortArgs(internal=6379, external=redis_port)],
    envs=[
        f"REDIS_CONF={redis_conf}",
    ],
    volumes=[
        docker.ContainerVolumeArgs(volume_name=volume.name, container_path="/data"),
        docker.ContainerVolumeArgs(
            host_path=entrypoint_path,
            container_path="/entrypoint.sh",
            read_only=True,
        ),
    ],
)

if redis_acl is not None:
    container_kwargs["envs"].append(pulumi.Output.concat("REDIS_ACL=", redis_acl))

if attach_npm:
    container_kwargs["networks_advanced"] = [
        docker.ContainerNetworksAdvancedArgs(name=npm_network)
    ]

container = docker.Container("redis", **container_kwargs)

pulumi.export("port", redis_port)
pulumi.export("containerName", container.name)
