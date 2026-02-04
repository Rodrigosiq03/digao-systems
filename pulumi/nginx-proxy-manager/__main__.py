import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

image_tag = config.get("imageTag") or "latest"
http_port = int(config.get("httpPort") or 80)
https_port = int(config.get("httpsPort") or 443)
admin_port = int(config.get("adminPort") or 81)

network_name = config.get("npmNetworkName") or "npm_default"

image = docker.RemoteImage(
    "npm-image",
    name=f"jc21/nginx-proxy-manager:{image_tag}",
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
