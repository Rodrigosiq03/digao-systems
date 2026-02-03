#!/usr/bin/env python3
import argparse
import configparser
import subprocess
import sys
from pathlib import Path


def load_secrets(path: Path) -> configparser.ConfigParser:
    parser = configparser.ConfigParser(interpolation=None)
    parser.optionxform = str
    if not path.exists():
        raise FileNotFoundError(f"Secrets file not found: {path}")
    parser.read(path)
    return parser


def resolve_project(project: str, base_dir: Path) -> Path:
    candidate = Path(project)
    if candidate.is_dir():
        return candidate
    return base_dir / project


def ensure_stack(project_dir: Path, stack: str, create: bool) -> None:
    result = subprocess.run(
        ["pulumi", "-C", str(project_dir), "stack", "select", stack],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        return
    if not create:
        sys.stderr.write(result.stderr)
        raise SystemExit(f"Stack {stack} not found. Use --create to initialize it.")
    init = subprocess.run(
        ["pulumi", "-C", str(project_dir), "stack", "init", stack],
        check=False,
        text=True,
    )
    if init.returncode != 0:
        raise SystemExit(f"Failed to init stack {stack}.")


def pulumi_set(project_dir: Path, stack: str, key: str, value: str, secret: bool) -> None:
    cmd = ["pulumi", "-C", str(project_dir), "config", "set", "--stack", stack]
    if secret:
        cmd.append("--secret")
    cmd.extend([key, value])
    subprocess.run(cmd, check=True)


def apply_rabbitmq(config: configparser.ConfigParser, env: str, project_dir: Path, stack: str) -> None:
    shared = config["shared"]
    pulumi_set(project_dir, stack, "rabbitmq:adminUser", shared["RABBITMQ_ADMIN_USER"], False)
    pulumi_set(project_dir, stack, "rabbitmq:adminPassword", shared["RABBITMQ_ADMIN_PASS"], True)
    pulumi_set(project_dir, stack, "rabbitmq:erlangCookie", shared["RABBITMQ_ERLANG_COOKIE"], True)
    # Single broker serves all vhosts, so set all user passwords in the same stack.
    for env_name in ("dev", "homolog", "prod"):
        env_block = config[env_name]
        pass_key = f"RABBITMQ_{env_name.upper()}_PASS"
        pulumi_set(project_dir, stack, f"rabbitmq:{env_name}Password", env_block[pass_key], True)


def apply_keycloak(config: configparser.ConfigParser, env: str, project_dir: Path, stack: str) -> None:
    shared = config["shared"]
    env_block = config[env]

    pulumi_set(project_dir, stack, "keycloak:dbUser", shared["KEYCLOAK_DB_USER"], False)
    pulumi_set(project_dir, stack, "keycloak:dbName", shared["KEYCLOAK_DB_NAME"], False)
    pulumi_set(project_dir, stack, "keycloak:adminUser", shared["KEYCLOAK_ADMIN_USER"], False)

    db_pass_key = f"KEYCLOAK_DB_PASS_{env.upper()}"
    admin_pass_key = f"KEYCLOAK_ADMIN_PASS_{env.upper()}"
    pulumi_set(project_dir, stack, "keycloak:dbPassword", env_block[db_pass_key], True)
    pulumi_set(project_dir, stack, "keycloak:adminPassword", env_block[admin_pass_key], True)


def main() -> None:
    base_dir = Path(__file__).resolve().parents[1]

    parser = argparse.ArgumentParser(description="Apply local secrets into a Pulumi stack.")
    parser.add_argument("--project", required=True, help="Project name or path (e.g., rabbitmq)")
    parser.add_argument("--stack", required=True, help="Pulumi stack name (e.g., dev)")
    parser.add_argument("--env", choices=["dev", "homolog", "prod"], required=True)
    parser.add_argument(
        "--secrets-file",
        default=str(base_dir / ".secrets.local"),
        help="Path to secrets file",
    )
    parser.add_argument("--create", action="store_true", help="Create stack if missing")

    args = parser.parse_args()
    project_dir = resolve_project(args.project, base_dir)
    if not project_dir.is_dir():
        raise SystemExit(f"Project directory not found: {project_dir}")

    secrets_file = Path(args.secrets_file)
    config = load_secrets(secrets_file)

    if "shared" not in config or args.env not in config:
        raise SystemExit("Secrets file must contain [shared] and environment sections.")

    ensure_stack(project_dir, args.stack, args.create)

    project_name = project_dir.name
    if project_name == "rabbitmq":
        apply_rabbitmq(config, args.env, project_dir, args.stack)
    elif project_name == "keycloak":
        apply_keycloak(config, args.env, project_dir, args.stack)
    else:
        raise SystemExit(f"Unknown project: {project_name}")


if __name__ == "__main__":
    main()
