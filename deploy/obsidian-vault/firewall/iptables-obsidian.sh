#!/usr/bin/env bash
set -euo pipefail

CHAIN="OBSIDIAN_TAILSCALE"
PORTS="80,443"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root (sudo)." >&2
  exit 1
fi

iptables -N "${CHAIN}" 2>/dev/null || true
iptables -F "${CHAIN}"

# Trafego ja estabelecido nao deve ser bloqueado.
iptables -A "${CHAIN}" -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A "${CHAIN}" -i lo -j ACCEPT

# Permite HTTP/HTTPS somente pela interface do Tailnet.
iptables -A "${CHAIN}" -i tailscale0 -p tcp -m multiport --dports "${PORTS}" -j ACCEPT

# Bloqueia HTTP/HTTPS vindo de qualquer outra interface.
iptables -A "${CHAIN}" -p tcp -m multiport --dports "${PORTS}" -j DROP

# Mantem o restante das regras globais da maquina.
iptables -A "${CHAIN}" -j RETURN

if ! iptables -C INPUT -j "${CHAIN}" >/dev/null 2>&1; then
  iptables -I INPUT 1 -j "${CHAIN}"
fi

echo "Regra aplicada: 80/443 liberados apenas em tailscale0."
