import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

image_tag = config.get("imageTag") or "2.27.1"
http_port = int(config.get("httpPort") or 9000)
https_port = int(config.get("httpsPort") or 9443)
expose_port = (config.get("exposePort") or "false").lower() == "true"
attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or "npm_default"
container_name = config.get("containerName") or "portainer-shared"

image = docker.RemoteImage(
    "portainer-image",
    name=f"portainer/portainer-ce:{image_tag}",
)

volume = docker.Volume("portainer-data", name=f"portainer-data-{stack}")

container_kwargs = dict(
    image=image.name,
    name=container_name,
    restart="unless-stopped",
    command=["-H", "unix:///var/run/docker.sock"],
    volumes=[
        docker.ContainerVolumeArgs(host_path="/var/run/docker.sock", container_path="/var/run/docker.sock"),
        docker.ContainerVolumeArgs(volume_name=volume.name, container_path="/data"),
    ],
)

if expose_port:
    container_kwargs["ports"] = [
        docker.ContainerPortArgs(internal=9000, external=http_port),
        docker.ContainerPortArgs(internal=9443, external=https_port),
    ]

if attach_npm:
    container_kwargs["networks_advanced"] = [
        docker.ContainerNetworksAdvancedArgs(name=npm_network)
    ]

container = docker.Container("portainer", **container_kwargs)

pulumi.export("httpPort", http_port)
pulumi.export("httpsPort", https_port)
pulumi.export("containerName", container.name)
