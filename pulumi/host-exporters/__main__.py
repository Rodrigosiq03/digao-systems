import pulumi
import pulumi_docker as docker

config = pulumi.Config()
stack = pulumi.get_stack()

network_name = config.get("networkName") or "observability"
deploy_node_exporter = (config.get("deployNodeExporter") or "true").lower() == "true"
deploy_cadvisor = (config.get("deployCadvisor") or "true").lower() == "true"

network = docker.Network(
    "observability-network",
    name=network_name,
    driver="bridge",
)

if deploy_node_exporter:
    node_exporter = docker.Container(
        "node-exporter",
        image="quay.io/prometheus/node-exporter:v1.9.0",
        name=f"node-exporter-{stack}",
        restart="unless-stopped",
        command=[
            "--path.rootfs=/host",
            "--collector.processes",
            "--collector.systemd",
        ],
        networks_advanced=[docker.ContainerNetworksAdvancedArgs(name=network.name)],
        volumes=[
            docker.ContainerVolumeArgs(host_path="/", container_path="/host", read_only=True, ),
            docker.ContainerVolumeArgs(host_path="/proc", container_path="/host/proc", read_only=True),
            docker.ContainerVolumeArgs(host_path="/sys", container_path="/host/sys", read_only=True),
            docker.ContainerVolumeArgs(host_path="/run/dbus/system_bus_socket", container_path="/run/dbus/system_bus_socket", read_only=True),
        ],
    )
    pulumi.export("nodeExporterContainer", node_exporter.name)

if deploy_cadvisor:
    cadvisor = docker.Container(
        "cadvisor",
        image="gcr.io/cadvisor/cadvisor:v0.49.1",
        name=f"cadvisor-{stack}",
        restart="unless-stopped",
        privileged=True,
        networks_advanced=[docker.ContainerNetworksAdvancedArgs(name=network.name)],
        ports=[],
        volumes=[
            docker.ContainerVolumeArgs(host_path="/", container_path="/rootfs", read_only=True),
            docker.ContainerVolumeArgs(host_path="/var/run", container_path="/var/run"),
            docker.ContainerVolumeArgs(host_path="/sys", container_path="/sys", read_only=True),
            docker.ContainerVolumeArgs(host_path="/var/lib/docker", container_path="/var/lib/docker", read_only=True),
            docker.ContainerVolumeArgs(host_path="/dev/disk", container_path="/dev/disk", read_only=True),
        ],
    )
    pulumi.export("cadvisorContainer", cadvisor.name)

pulumi.export("networkName", network.name)
