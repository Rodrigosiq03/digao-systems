#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
ENV_FILE="${ROOT_DIR}/.env"

failures=0
db_user=""
db_pass=""

if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  db_user="${DB_USER:-}"
  db_pass="${DB_PASS:-}"
fi

ok() {
  echo "[OK] $*"
}

fail() {
  echo "[FAIL] $*"
  failures=$((failures + 1))
}

check_running() {
  local name="$1"
  local running
  running="$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null || true)"
  if [[ "${running}" == "true" ]]; then
    ok "container '$name' em execucao"
  else
    fail "container '$name' fora do ar"
  fi
}

check_running "npm-prod"
check_running "obsidian-couchdb-prod"

health="$(docker inspect -f '{{.State.Health.Status}}' obsidian-couchdb-prod 2>/dev/null || true)"
if [[ "${health}" == "healthy" ]]; then
  ok "healthcheck do couchdb = healthy"
elif [[ "${health}" == "starting" ]]; then
  echo "[WARN] healthcheck do couchdb ainda em starting."
else
  fail "healthcheck do couchdb = ${health:-indefinido}"
fi

if docker exec obsidian-couchdb-prod curl -fsS -u "${db_user}:${db_pass}" http://127.0.0.1:5984/_up | grep -q '"status":"ok"'; then
  ok "couchdb responde /_up"
else
  fail "couchdb nao respondeu /_up"
fi

if docker exec npm-prod curl -fsS -u "${db_user}:${db_pass}" http://obsidian-couchdb-prod:5984/_up | grep -q '"status":"ok"'; then
  ok "npm-prod alcanca couchdb por DNS docker"
else
  fail "npm-prod NAO alcanca obsidian-couchdb-prod:5984"
fi

if [[ -f "${ENV_FILE}" ]]; then
  if [[ -n "${OBSIDIAN_DOMAIN:-}" ]] && [[ "${OBSIDIAN_DOMAIN}" != "notas.seudominio.com" ]]; then
    code="$(curl -ksS -o /dev/null -w '%{http_code}' "https://${OBSIDIAN_DOMAIN}" || true)"
    if [[ "${code}" =~ ^(200|301|302|401|403)$ ]]; then
      ok "dominio ${OBSIDIAN_DOMAIN} respondeu HTTPS (${code})"
    elif [[ "${code}" == "000" ]]; then
      echo "[WARN] dominio ${OBSIDIAN_DOMAIN} ainda sem DNS/rota (HTTP 000)."
    else
      fail "dominio ${OBSIDIAN_DOMAIN} respondeu ${code:-erro}"
    fi
  fi
fi

docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps

if [[ "${failures}" -gt 0 ]]; then
  echo "[RESULTADO] ${failures} falha(s) detectada(s)."
  exit 1
fi

echo "[RESULTADO] stack Obsidian saudavel."
