#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root (sudo)." >&2
  exit 1
fi

CHAIN="DIGAO_TAILSCALE_ENVS"

DEV_PORTS="8080,8443,8181"
HOMOLOG_PORTS="8083,8444,8182"
PROD_PORTS="80,443,81"

ALL_PORTS="${DEV_PORTS},${HOMOLOG_PORTS},${PROD_PORTS}"

iptables -N "${CHAIN}" 2>/dev/null || true
iptables -F "${CHAIN}"

# Nao quebra trafego existente.
iptables -A "${CHAIN}" -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A "${CHAIN}" -i lo -j ACCEPT

# Todos os acessos aos endpoints publicados so entram por tailscale0.
iptables -A "${CHAIN}" -i tailscale0 -p tcp -m multiport --dports "${ALL_PORTS}" -j ACCEPT
iptables -A "${CHAIN}" -p tcp -m multiport --dports "${ALL_PORTS}" -j DROP

iptables -A "${CHAIN}" -j RETURN

if ! iptables -C INPUT -j "${CHAIN}" >/dev/null 2>&1; then
  iptables -I INPUT 1 -j "${CHAIN}"
fi

echo "Regra aplicada para dev/homolog/prod via tailscale0."
