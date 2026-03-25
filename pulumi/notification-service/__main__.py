import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

NETWORK_BY_STACK = {
    "dev": "npm_dev",
    "homolog": "npm_homolog",
    "prod": "npm_prod",
}

service_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "services", "java", "notification-service")
)
image_context_dir = os.path.join(service_dir, "target", "pulumi-image-context")

image_tag = config.get("imageTag") or stack
http_port = int(config.get("httpPort") or 8082)
expose_port = (config.get("exposePort") or ("true" if stack == "dev" else "false")).lower() == "true"

rabbit_host = config.get("rabbitHost") or f"rabbitmq-{stack}"
rabbit_user = config.get("rabbitUser") or stack
rabbit_password = config.require_secret("rabbitPassword")
rabbit_vhost = config.get("rabbitVhost") or f"/{stack}"

rabbit_exchange = config.get("rabbitExchange") or "notification.exchange"
rabbit_routing_key = config.get("rabbitRoutingKey") or "digao.auth.email.send"
rabbit_queue = config.get("rabbitQueue") or "notification.email.queue"

redis_host = config.get("redisHost") or f"redis-{stack}"
redis_password = config.get_secret("redisPassword")

mail_user = config.get("mailUser") or ""
mail_password = config.require_secret("mailPassword")

attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or NETWORK_BY_STACK.get(stack, "npm_default")

image = docker.Image(
    "notification-image",
    image_name=f"docker.io/library/notification-service:{image_tag}",
    skip_push=True,
    build=docker.DockerBuildArgs(
        context=image_context_dir,
        dockerfile=os.path.join(image_context_dir, "Dockerfile"),
    ),
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
]

if redis_password:
    envs.append(pulumi.Output.concat("REDIS_PASSWORD=", redis_password))

envs += [
    f"MAIL_USERNAME={mail_user}",
    pulumi.Output.concat("MAIL_PASSWORD=", mail_password),
]

container_kwargs = dict(
    image=image.repo_digest,
    name=f"notification-{stack}",
    restart="unless-stopped",
    envs=envs,
)

if expose_port:
    container_kwargs["ports"] = [docker.ContainerPortArgs(internal=8082, external=http_port)]

networks_advanced = [docker.ContainerNetworksAdvancedArgs(name="bridge")]
if attach_npm:
    networks_advanced.append(docker.ContainerNetworksAdvancedArgs(name=npm_network))
container_kwargs["networks_advanced"] = networks_advanced

container = docker.Container("notification", **container_kwargs)

pulumi.export("httpPort", http_port)
pulumi.export("containerName", container.name)
