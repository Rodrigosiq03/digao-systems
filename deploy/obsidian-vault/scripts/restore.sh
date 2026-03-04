#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
ENV_FILE="${ROOT_DIR}/.env"

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <arquivo-backup.tar.gz> [--yes]" >&2
  exit 1
fi

ARCHIVE="$1"
FORCE="${2:-}"

if [[ ! -f "${ARCHIVE}" ]]; then
  echo "[ERRO] backup nao encontrado: ${ARCHIVE}" >&2
  exit 1
fi

if [[ "${FORCE}" != "--yes" ]]; then
  echo "[ERRO] restore exige confirmacao explicita: adicione --yes" >&2
  exit 1
fi

"${ROOT_DIR}/scripts/bootstrap.sh"
"${ROOT_DIR}/scripts/backup.sh"

echo "[INFO] parando stack atual..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" down

echo "[INFO] limpando dados atuais..."
rm -rf "${ROOT_DIR}/runtime/prod/couchdb/data"
mkdir -p "${ROOT_DIR}/runtime/prod/couchdb/data"

echo "[INFO] restaurando ${ARCHIVE}..."
tar -xzf "${ARCHIVE}" -C "${ROOT_DIR}"

echo "[INFO] subindo stack restaurada..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps

echo "[OK] restore finalizado."
