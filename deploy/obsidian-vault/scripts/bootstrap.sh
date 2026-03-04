#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERRO] comando obrigatorio ausente: $1" >&2
    exit 1
  fi
}

require_cmd docker

if ! docker compose version >/dev/null 2>&1; then
  echo "[ERRO] docker compose plugin nao encontrado." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${ROOT_DIR}/.env.example" "${ENV_FILE}"
  echo "[INFO] .env criado a partir de .env.example."
fi

mkdir -p \
  "${ROOT_DIR}/runtime/prod/couchdb/data" \
  "${ROOT_DIR}/runtime/prod/backups" \
  "${ROOT_DIR}/logs"

if ! docker network inspect npm_prod >/dev/null 2>&1; then
  cat >&2 <<'EOF'
[ERRO] rede docker 'npm_prod' nao existe.
Suba primeiro o NPM de prod:
  PULUMI_CONFIG_PASSPHRASE='SUA_PASSPHRASE' pulumi -C /data/apps/pulumi/nginx-proxy-manager up --stack prod --yes
EOF
  exit 1
fi

echo "[OK] bootstrap concluido."
