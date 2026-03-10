import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

image_tag = config.get("imageTag") or "v2.53.1"
http_port = int(config.get("httpPort") or 9090)
expose_port = (config.get("exposePort") or "false").lower() == "true"

attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or "npm_default"
extra_networks = [
    name.strip()
    for name in (config.get("extraNetworkNames") or "").split(",")
    if name.strip()
]

config_filename = config.get("configFile") or "prometheus.yml"
config_path = os.path.abspath(os.path.join(os.path.dirname(__file__), config_filename))

image = docker.RemoteImage(
    "prometheus-image",
    name=f"prom/prometheus:{image_tag}",
)

volume = docker.Volume("prometheus-data", name=f"prometheus-data-{stack}")

container_kwargs = dict(
    image=image.name,
    name=f"prometheus-{stack}",
    restart="unless-stopped",
    command=["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus"],
    volumes=[
        docker.ContainerVolumeArgs(volume_name=volume.name, container_path="/prometheus"),
        docker.ContainerVolumeArgs(host_path=config_path, container_path="/etc/prometheus/prometheus.yml", read_only=True),
    ],
)

if expose_port:
    container_kwargs["ports"] = [docker.ContainerPortArgs(internal=9090, external=http_port)]

if attach_npm:
    container_kwargs.setdefault("networks_advanced", []).append(
        docker.ContainerNetworksAdvancedArgs(name=npm_network)
    )

for network_name in extra_networks:
    container_kwargs.setdefault("networks_advanced", []).append(
        docker.ContainerNetworksAdvancedArgs(name=network_name)
    )

container = docker.Container("prometheus", **container_kwargs)

pulumi.export("httpPort", http_port)
pulumi.export("containerName", container.name)
