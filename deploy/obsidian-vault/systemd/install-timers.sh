#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root (sudo)." >&2
  exit 1
fi

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_DIR="/etc/systemd/system"

install -m 0644 "${BASE_DIR}/obsidian-vault-healthcheck.service" "${SYSTEMD_DIR}/obsidian-vault-healthcheck.service"
install -m 0644 "${BASE_DIR}/obsidian-vault-healthcheck.timer" "${SYSTEMD_DIR}/obsidian-vault-healthcheck.timer"
install -m 0644 "${BASE_DIR}/obsidian-vault-backup.service" "${SYSTEMD_DIR}/obsidian-vault-backup.service"
install -m 0644 "${BASE_DIR}/obsidian-vault-backup.timer" "${SYSTEMD_DIR}/obsidian-vault-backup.timer"

systemctl daemon-reload
systemctl enable --now obsidian-vault-healthcheck.timer
systemctl enable --now obsidian-vault-backup.timer

systemctl list-timers --all | grep -E 'obsidian-vault-(healthcheck|backup)\.timer' || true
echo "Timers instalados."
