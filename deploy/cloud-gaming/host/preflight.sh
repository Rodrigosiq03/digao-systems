#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8090}"
TARGET_USER="${TARGET_USER:-$USER}"

green() { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
red() { printf "\033[31m%s\033[0m\n" "$*"; }

ok=0
warn=0
fail=0

pass() {
  green "[PASS] $1"
  ok=$((ok + 1))
}

warning() {
  yellow "[WARN] $1"
  warn=$((warn + 1))
}

fatal() {
  red "[FAIL] $1"
  fail=$((fail + 1))
}

check_file_contains() {
  local file="$1"
  local pattern="$2"
  if [[ -f "$file" ]] && grep -qE "$pattern" "$file"; then
    return 0
  fi
  return 1
}

if check_file_contains /etc/systemd/logind.conf.d/99-lid.conf 'HandleLidSwitch=ignore'; then
  pass "logind lid ignore configurado"
else
  warning "logind lid ignore ausente"
fi

if check_file_contains /etc/systemd/sleep.conf.d/99-no-suspend.conf 'AllowSuspend=no'; then
  pass "suspend/hibernate desativado no systemd"
else
  warning "sleep.conf.d nao encontrado (suspend pode ocorrer)"
fi

if loginctl show-user "${TARGET_USER}" -p Linger 2>/dev/null | grep -q 'Linger=yes'; then
  pass "linger habilitado para ${TARGET_USER}"
else
  warning "linger nao habilitado para ${TARGET_USER}"
fi

if systemctl is-enabled sshd >/dev/null 2>&1; then
  pass "sshd enabled"
else
  fatal "sshd desabilitado"
fi

if systemctl is-enabled tailscaled >/dev/null 2>&1; then
  pass "tailscaled enabled"
else
  fatal "tailscaled desabilitado"
fi

if systemctl --user is-enabled sunshine >/dev/null 2>&1; then
  pass "sunshine user service enabled"
else
  warning "sunshine user service nao habilitado"
fi

session_types="$(
  loginctl list-sessions --no-legend 2>/dev/null \
    | awk '{print $1}' \
    | while read -r sid; do
        loginctl show-session "$sid" -p Type --value 2>/dev/null || true
      done
)"
if echo "${session_types}" | grep -qE '^(wayland|x11)$'; then
  pass "sessao grafica detectada (wayland/x11)"
else
  warning "nenhuma sessao grafica detectada (somente tty?)"
fi

connected_count=0
for status_file in /sys/class/drm/card*-*/status; do
  [[ -e "${status_file}" ]] || continue
  if [[ "$(cat "${status_file}" 2>/dev/null)" == "connected" ]]; then
    connected_count=$((connected_count + 1))
  fi
done
if [[ "${connected_count}" -ge 1 ]]; then
  pass "monitor conectado detectado (${connected_count})"
else
  warning "nenhum monitor conectado detectado (use HDMI dummy se headless)"
fi

if curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1; then
  pass "cloud-gaming backend saudável na porta ${PORT}"
else
  warning "cloud-gaming backend nao responde em :${PORT}"
fi

echo
echo "Resumo: PASS=${ok} WARN=${warn} FAIL=${fail}"
if [[ "${fail}" -gt 0 ]]; then
  exit 1
fi

if [[ "${warn}" -gt 0 ]]; then
  exit 2
fi

exit 0
