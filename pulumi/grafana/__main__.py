import os
import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

image_tag = config.get("imageTag") or "11.1.4"
http_port = int(config.get("httpPort") or 3000)
expose_port = (config.get("exposePort") or "false").lower() == "true"
attach_npm = (config.get("attachToNpm") or "true").lower() == "true"
npm_network = config.get("npmNetworkName") or "npm_default"
extra_networks = [
    name.strip()
    for name in (config.get("extraNetworkNames") or "").split(",")
    if name.strip()
]
admin_user = config.get("adminUser") or "admin"
admin_password = config.require_secret("adminPassword")
provisioning_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "provisioning", stack)
)
dashboards_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "dashboards")
)

image = docker.RemoteImage(
    "grafana-image",
    name=f"grafana/grafana-oss:{image_tag}",
)

volume = docker.Volume("grafana-data", name=f"grafana-data-{stack}")

container_kwargs = dict(
    image=image.name,
    name=f"grafana-{stack}",
    restart="unless-stopped",
    envs=[
        f"GF_SECURITY_ADMIN_USER={admin_user}",
        pulumi.Output.concat("GF_SECURITY_ADMIN_PASSWORD=", admin_password),
        "GF_USERS_ALLOW_SIGN_UP=false",
        "GF_SERVER_ROOT_URL=%(protocol)s://%(domain)s/",
    ],
    volumes=[
        docker.ContainerVolumeArgs(volume_name=volume.name, container_path="/var/lib/grafana"),
        docker.ContainerVolumeArgs(host_path=provisioning_dir, container_path="/etc/grafana/provisioning", read_only=True),
        docker.ContainerVolumeArgs(host_path=dashboards_dir, container_path="/var/lib/grafana/dashboards", read_only=True),
    ],
)

if expose_port:
    container_kwargs["ports"] = [docker.ContainerPortArgs(internal=3000, external=http_port)]

networks = []
if attach_npm:
    networks.append(docker.ContainerNetworksAdvancedArgs(name=npm_network))
for network_name in extra_networks:
    networks.append(docker.ContainerNetworksAdvancedArgs(name=network_name))
if networks:
    container_kwargs["networks_advanced"] = networks

container = docker.Container("grafana", **container_kwargs)

pulumi.export("httpPort", http_port)
pulumi.export("containerName", container.name)
