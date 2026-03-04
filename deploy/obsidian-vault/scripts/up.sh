#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
ENV_FILE="${ROOT_DIR}/.env"

"${ROOT_DIR}/scripts/bootstrap.sh"

# shellcheck disable=SC1090
source "${ENV_FILE}"

if [[ "${DB_PASS:-change-me-strong-password}" == "change-me-strong-password" ]]; then
  echo "[ERRO] DB_PASS ainda esta com valor padrao em ${ENV_FILE}." >&2
  exit 1
fi

docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps

echo
echo "[INFO] couchdb no ar. Proximo passo: criar Proxy Host no npm-prod (painel na porta 81)."
