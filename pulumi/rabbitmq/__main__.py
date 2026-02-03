import json
import pulumi
import pulumi_docker as docker
import pulumi_command as command

config = pulumi.Config()
stack = pulumi.get_stack()

runtime_dir = config.get("runtimeDir") or "/srv/pulumi"
stack_dir = f"{runtime_dir}/rabbitmq"

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

write_config = command.local.Command(
    "rabbitmq-config",
    create="""bash -c 'set -euo pipefail
mkdir -p "$STACK_DIR"
install -m 0600 /dev/null "$STACK_DIR/definitions.json"
printf "%s" "$DEFINITIONS_JSON" > "$STACK_DIR/definitions.json"
install -m 0644 /dev/null "$STACK_DIR/rabbitmq.conf"
printf "%s" "$RABBITMQ_CONF" > "$STACK_DIR/rabbitmq.conf"
'""",
    update="""bash -c 'set -euo pipefail
mkdir -p "$STACK_DIR"
install -m 0600 /dev/null "$STACK_DIR/definitions.json"
printf "%s" "$DEFINITIONS_JSON" > "$STACK_DIR/definitions.json"
install -m 0644 /dev/null "$STACK_DIR/rabbitmq.conf"
printf "%s" "$RABBITMQ_CONF" > "$STACK_DIR/rabbitmq.conf"
'""",
    delete="""bash -c 'set -euo pipefail
rm -f "$STACK_DIR/definitions.json" "$STACK_DIR/rabbitmq.conf"
'""",
    environment={
        "STACK_DIR": stack_dir,
        "RABBITMQ_CONF": rabbitmq_conf,
        "DEFINITIONS_JSON": definitions_json,
    },
    triggers=[rabbitmq_conf, definitions_json, stack_dir],
)

image = docker.RemoteImage("rabbitmq-image", name=f"rabbitmq:{image_tag}")

data_volume = docker.Volume("rabbitmq-data", name=f"rabbitmq-data-{stack}")

container = docker.Container(
    "rabbitmq",
    image=image.name,
    name=f"rabbitmq-{stack}",
    hostname="rabbitmq",
    restart="unless-stopped",
    ports=[
        docker.ContainerPortArgs(internal=5672, external=amqp_port),
        docker.ContainerPortArgs(internal=15672, external=http_port),
    ],
    envs=[pulumi.Output.concat("RABBITMQ_ERLANG_COOKIE=", erlang_cookie)],
    volumes=[
        docker.ContainerVolumeArgs(
            volume_name=data_volume.name,
            container_path="/var/lib/rabbitmq",
        ),
        docker.ContainerVolumeArgs(
            host_path=f"{stack_dir}/rabbitmq.conf",
            container_path="/etc/rabbitmq/rabbitmq.conf",
            read_only=True,
        ),
        docker.ContainerVolumeArgs(
            host_path=f"{stack_dir}/definitions.json",
            container_path="/etc/rabbitmq/definitions.json",
            read_only=True,
        ),
    ],
    depends_on=[write_config],
)

pulumi.export("amqpPort", amqp_port)
pulumi.export("httpPort", http_port)
pulumi.export("containerName", container.name)
pulumi.export("vhosts", vhosts)
