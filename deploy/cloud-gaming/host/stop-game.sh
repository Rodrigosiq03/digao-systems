#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'MSG'
Uso:
  stop-game.sh [--user rodrigo] [--match 'regex']
MSG
}

user_name="rodrigo"
match_expr=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --user)
      shift
      user_name="${1:-rodrigo}"
      ;;
    --match)
      shift
      match_expr="${1:-}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERR] argumento invalido: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift || true
done

unlock_helper="${CLOUD_GAMING_UNLOCK_HELPER:-/data/apps/deploy/cloud-gaming/host/unlock-kde-session.sh}"
runtime_dir="/run/user/$(id -u "${user_name}")/digao-cloud-gaming"
state_file="${runtime_dir}/session.env"

kill_pattern() {
  local signal="${1}"
  local pattern="${2}"
  pkill "-${signal}" -f "${pattern}" >/dev/null 2>&1 || true
}

wait_pattern_gone() {
  local pattern="${1}"
  for _ in $(seq 1 20); do
    if ! pgrep -f "${pattern}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

steam -shutdown >/dev/null 2>&1 || true

base_patterns=(
  "gamescope"
  "gamescopereaper"
  "steam -applaunch"
  "steamwebhelper"
  "/data/apps/deploy/cloud-gaming/host/launch-game.sh"
)

for pattern in "${base_patterns[@]}"; do
  kill_pattern TERM "${pattern}"
done
if [[ -n "${match_expr}" ]]; then
  kill_pattern TERM "${match_expr}"
fi

for pattern in "${base_patterns[@]}"; do
  wait_pattern_gone "${pattern}" || kill_pattern KILL "${pattern}"
done
if [[ -n "${match_expr}" ]]; then
  wait_pattern_gone "${match_expr}" || kill_pattern KILL "${match_expr}"
fi

rm -f "${state_file}"
if [[ -x "${unlock_helper}" ]]; then
  "${unlock_helper}" "${user_name}" >/dev/null 2>&1 || true
fi
systemctl --user restart cloud-gaming-motor.service >/dev/null 2>&1 || true

echo "[OK] cloud gaming stop cleanup concluido"
