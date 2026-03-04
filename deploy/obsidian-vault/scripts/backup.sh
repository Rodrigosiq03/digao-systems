#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
BACKUP_DIR="${ROOT_DIR}/runtime/prod/backups"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="${BACKUP_DIR}/obsidian-vault-${TIMESTAMP}.tar.gz"

"${ROOT_DIR}/scripts/bootstrap.sh"

mkdir -p "${BACKUP_DIR}"

if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

echo "[INFO] gerando backup em ${ARCHIVE}"
tar -czf "${ARCHIVE}" \
  -C "${ROOT_DIR}" \
  runtime/prod/couchdb/data \
  couchdb/local.ini \
  .env

sha256sum "${ARCHIVE}" > "${ARCHIVE}.sha256"
echo "[OK] backup criado: ${ARCHIVE}"

retention_days="${BACKUP_RETENTION_DAYS:-14}"
if [[ "${retention_days}" =~ ^[0-9]+$ ]]; then
  find "${BACKUP_DIR}" -type f -name 'obsidian-vault-*.tar.gz*' -mtime +"${retention_days}" -delete
  echo "[OK] limpeza aplicada (retencao ${retention_days} dias)."
fi
