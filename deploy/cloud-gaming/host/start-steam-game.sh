#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'MSG'
Uso:
  start-steam-game.sh <game-id>

Game IDs suportados:
  weed-shop-3
  schedule-i
MSG
}

game_id="${1:-}"
if [[ -z "${game_id}" ]]; then
  usage >&2
  exit 1
fi

case "${game_id}" in
  weed-shop-3)
    exec steam -applaunch 1182110
    ;;
  schedule-i)
    exec steam -applaunch 3164500
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    echo "[ERR] unknown steam game id: ${game_id}" >&2
    usage >&2
    exit 1
    ;;
esac
