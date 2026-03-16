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

if ! command -v rpcs3 >/dev/null 2>&1; then
  echo "[ERR] rpcs3 nao encontrado no PATH" >&2
  exit 1
fi

if [[ ! -d "${game_dir}" ]]; then
  echo "[ERR] game directory not found: ${game_dir}" >&2
  exit 1
fi

exec rpcs3 --no-gui "${game_dir}"
