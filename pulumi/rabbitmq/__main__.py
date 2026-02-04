import json
import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

image_tag = config.get("imageTag") or "3.12-management"
amqp_port = int(config.get("amqpPort") or 5672)
http_port = int(config.get("httpPort") or 15672)

memory_watermark = config.get("memoryWatermark") or "0.4"
disk_free_limit = config.get("diskFreeLimit") or "1GB"
collect_statistics_interval = int(config.get("collectStatisticsInterval") or 30000)

vhosts = config.get_object("vhosts") or ["/dev", "/homolog", "/prod"]
users = config.get_object("users") or [
    {"name": "dev", "vhost": "/dev"},
    {"name": "homolog", "vhost": "/homolog"},
    {"name": "prod", "vhost": "/prod"},
]

admin_user = config.get("adminUser") or "admin"
admin_password = config.require_secret("adminPassword")
erlang_cookie = config.require_secret("erlangCookie")

passwords = {
    "dev": config.require_secret("devPassword"),
    "homolog": config.require_secret("homologPassword"),
    "prod": config.require_secret("prodPassword"),
}

missing = [u.get("name") for u in users if u.get("name") not in passwords]
if missing:
    raise Exception(
        "Missing secret password config for users: " + ", ".join(missing)
    )

rabbitmq_conf = "\n".join(
    [
        f"vm_memory_high_watermark = {memory_watermark}",
        f"disk_free_limit.absolute = {disk_free_limit}",
        f"collect_statistics_interval = {collect_statistics_interval}",
        "management.load_definitions = /etc/rabbitmq/definitions.json",
        "",
    ]
)


def build_definitions(args):
    admin_pass, dev_pass, homolog_pass, prod_pass = args
    password_map = {
        "dev": dev_pass,
        "homolog": homolog_pass,
        "prod": prod_pass,
    }

    user_defs = [
        {
            "name": admin_user,
            "password": admin_pass,
            "tags": "administrator",
        }
    ]

    for u in users:
        user_defs.append(
            {
                "name": u["name"],
                "password": password_map[u["name"]],
                "tags": u.get("tags", ""),
            }
        )

    vhost_defs = [{"name": v} for v in vhosts]

    permissions = []
    for u in users:
        permissions.append(
            {
                "user": u["name"],
                "vhost": u["vhost"],
                "configure": ".*",
                "write": ".*",
                "read": ".*",
            }
        )

    for v in vhosts:
        permissions.append(
            {
                "user": admin_user,
                "vhost": v,
                "configure": ".*",
                "write": ".*",
                "read": ".*",
            }
        )

    return json.dumps(
        {
            "users": user_defs,
            "vhosts": vhost_defs,
            "permissions": permissions,
        }
    )


definitions_json = pulumi.Output.all(
    admin_password,
    passwords["dev"],
    passwords["homolog"],
    passwords["prod"],
).apply(build_definitions)

image = docker.RemoteImage("rabbitmq-image", name=f"rabbitmq:{image_tag}")

data_volume = docker.Volume("rabbitmq-data", name=f"rabbitmq-data-{stack}")

entrypoint_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "entrypoint.sh")
)

container = docker.Container(
    "rabbitmq",
    image=image.name,
    name=f"rabbitmq-{stack}",
    hostname="rabbitmq",
    restart="unless-stopped",
    command=["/bin/sh", "-c", "/entrypoint.sh"],
    ports=[
        docker.ContainerPortArgs(internal=5672, external=amqp_port),
        docker.ContainerPortArgs(internal=15672, external=http_port),
    ],
    envs=[
        pulumi.Output.concat("RABBITMQ_ERLANG_COOKIE=", erlang_cookie),
        pulumi.Output.concat("RABBITMQ_DEFINITIONS_JSON=", definitions_json),
        pulumi.Output.concat("RABBITMQ_CONF=", rabbitmq_conf),
    ],
    volumes=[
        docker.ContainerVolumeArgs(
            volume_name=data_volume.name,
            container_path="/var/lib/rabbitmq",
        ),
        docker.ContainerVolumeArgs(
            host_path=entrypoint_path,
            container_path="/entrypoint.sh",
            read_only=True,
        ),
    ],
)

pulumi.export("amqpPort", amqp_port)
pulumi.export("httpPort", http_port)
pulumi.export("containerName", container.name)
pulumi.export("vhosts", vhosts)
