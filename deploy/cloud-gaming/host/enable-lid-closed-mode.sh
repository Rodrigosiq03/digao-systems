#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "[ERRO] rode como root: sudo bash $0 [usuario]" >&2
  exit 1
fi

TARGET_USER="${1:-rodrigo}"

mkdir -p /etc/systemd/logind.conf.d
mkdir -p /etc/systemd/sleep.conf.d

cat >/etc/systemd/logind.conf.d/99-lid.conf <<'EOF'
[Login]
HandleLidSwitch=ignore
HandleLidSwitchDocked=ignore
HandleLidSwitchExternalPower=ignore
EOF

cat >/etc/systemd/sleep.conf.d/99-no-suspend.conf <<'EOF'
[Sleep]
AllowSuspend=no
AllowHibernation=no
AllowSuspendThenHibernate=no
AllowHybridSleep=no
EOF

systemctl restart systemd-logind
loginctl enable-linger "${TARGET_USER}"
systemctl enable --now sshd
systemctl enable --now tailscaled

echo "[OK] modo tampa-fechada aplicado para usuario=${TARGET_USER}"
echo "[INFO] proximo passo: no usuario ${TARGET_USER}, habilitar sunshine:"
echo "       systemctl --user enable --now sunshine"
