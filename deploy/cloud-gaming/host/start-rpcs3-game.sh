#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'MSG'
Uso:
  start-rpcs3-game.sh <game-id>

Game IDs suportados:
  god-of-war-iii
MSG
}

game_id="${1:-}"
if [[ -z "${game_id}" ]]; then
  usage >&2
  exit 1
fi

case "${game_id}" in
  god-of-war-iii)
    game_dir="/lexar/games/God of War III"
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    echo "[ERR] unknown rpcs3 game id: ${game_id}" >&2
    usage >&2
    exit 1
    ;;
esac

if [[ -n "${RPCS3_BIN:-}" ]]; then
  rpcs3_bin="${RPCS3_BIN}"
elif command -v rpcs3 >/dev/null 2>&1; then
  rpcs3_bin="$(command -v rpcs3)"
elif [[ -x "/data/downloads/rpcs3-v0.0.38-18397-5a9083e4_linux64.AppImage" ]]; then
  rpcs3_bin="/data/downloads/rpcs3-v0.0.38-18397-5a9083e4_linux64.AppImage"
else
  echo "[ERR] rpcs3 nao encontrado no PATH nem no AppImage padrao" >&2
  exit 1
fi

if [[ ! -d "${game_dir}" ]]; then
  echo "[ERR] game directory not found: ${game_dir}" >&2
  exit 1
fi

exec "${rpcs3_bin}" --no-gui "${game_dir}"
