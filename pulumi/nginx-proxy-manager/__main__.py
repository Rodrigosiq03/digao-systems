import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

NETWORK_BY_STACK = {
    "dev": "npm_dev",
    "homolog": "npm_homolog",
    "prod": "npm_prod",
}
PORTS_BY_STACK = {
    "dev": (8080, 8443, 8181),
    "homolog": (8083, 8444, 8182),
    "prod": (80, 443, 81),
}

image_ref = config.get("imageRef") or "jc21/nginx-proxy-manager@sha256:cd9eba29ca132cb006729f2cb2660126453f84818c2f7d75963ad7b61ef696bd"
default_http, default_https, default_admin = PORTS_BY_STACK.get(stack, (80, 443, 81))
http_port = int(config.get("httpPort") or default_http)
https_port = int(config.get("httpsPort") or default_https)
admin_port = int(config.get("adminPort") or default_admin)

network_name = config.get("npmNetworkName") or NETWORK_BY_STACK.get(stack, "npm_default")

image = docker.RemoteImage(
    "npm-image",
    name=image_ref,
    keep_locally=True,
    opts=pulumi.ResourceOptions(retain_on_delete=True),
)

network = docker.Network(
    "npm-network",
    name=network_name,
    driver="bridge",
)

vol_data = docker.Volume("npm-data", name=f"npm-data-{stack}")
vol_lets = docker.Volume("npm-letsencrypt", name=f"npm-letsencrypt-{stack}")

container = docker.Container(
    "npm",
    image=image.name,
    name=f"npm-{stack}",
    restart="unless-stopped",
    ports=[
        docker.ContainerPortArgs(internal=80, external=http_port),
        docker.ContainerPortArgs(internal=81, external=admin_port),
        docker.ContainerPortArgs(internal=443, external=https_port),
    ],
    networks_advanced=[docker.ContainerNetworksAdvancedArgs(name=network.name)],
    volumes=[
        docker.ContainerVolumeArgs(volume_name=vol_data.name, container_path="/data"),
        docker.ContainerVolumeArgs(
            volume_name=vol_lets.name,
            container_path="/etc/letsencrypt",
        ),
    ],
)

pulumi.export("httpPort", http_port)
pulumi.export("httpsPort", https_port)
pulumi.export("adminPort", admin_port)
pulumi.export("containerName", container.name)
pulumi.export("imageRef", image_ref)
