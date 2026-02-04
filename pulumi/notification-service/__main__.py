import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "services", "notification-service"))

image_tag = config.get("imageTag") or stack
http_port = int(config.get("httpPort") or 8082)

rabbit_host = config.get("rabbitHost") or f"rabbitmq-{stack}"
rabbit_user = config.get("rabbitUser") or stack
rabbit_password = config.require_secret("rabbitPassword")
rabbit_vhost = config.get("rabbitVhost") or f"/{stack}"

rabbit_exchange = config.get("rabbitExchange") or "notification.exchange"
rabbit_routing_key = config.get("rabbitRoutingKey") or "digao.notification.email.send"
rabbit_queue = config.get("rabbitQueue") or "notification.email.queue"

redis_host = config.get("redisHost") or "redis"

mail_user = config.get("mailUser") or ""
mail_password = config.require_secret("mailPassword")

attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or "npm_default"

image = docker.Image(
    "notification-image",
    image_name=f"notification-service:{image_tag}",
    build=docker.DockerBuildArgs(context=service_dir, dockerfile="Dockerfile"),
)

envs = [
    f"RABBIT_HOST={rabbit_host}",
    f"RABBIT_USER={rabbit_user}",
    pulumi.Output.concat("RABBIT_PASS=", rabbit_password),
    f"SPRING_RABBITMQ_VIRTUAL_HOST={rabbit_vhost}",
    f"RABBIT_EXCHANGE={rabbit_exchange}",
    f"RABBIT_ROUTING_KEY={rabbit_routing_key}",
    f"RABBIT_QUEUE={rabbit_queue}",
    f"REDIS_HOST={redis_host}",
    f"MAIL_USERNAME={mail_user}",
    pulumi.Output.concat("MAIL_PASSWORD=", mail_password),
]

container_kwargs = dict(
    image=image.image_name,
    name=f"notification-{stack}",
    restart="unless-stopped",
    ports=[docker.ContainerPortArgs(internal=8082, external=http_port)],
    envs=envs,
)

if attach_npm:
    container_kwargs["networks_advanced"] = [
        docker.ContainerNetworksAdvancedArgs(name=npm_network)
    ]

container = docker.Container("notification", **container_kwargs)

pulumi.export("httpPort", http_port)
pulumi.export("containerName", container.name)
