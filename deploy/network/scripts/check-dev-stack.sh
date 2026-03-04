#!/usr/bin/env bash
set -euo pipefail

failures=0

ok() {
  echo "[OK] $*"
}

fail() {
  echo "[FAIL] $*"
  failures=$((failures + 1))
}

check_container_running() {
  local name="$1"
  local running
  running="$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null || true)"
  if [[ "$running" == "true" ]]; then
    ok "container '$name' em execucao"
  else
    fail "container '$name' nao esta em execucao"
  fi
}

check_http_up() {
  local name="$1"
  local url="$2"
  local expected_regex="$3"
  local code
  code="$(curl -ksS -o /dev/null -w '%{http_code}' --max-time 8 "$url" || true)"
  if [[ "$code" =~ $expected_regex ]]; then
    ok "$name respondeu HTTP $code ($url)"
  else
    fail "$name respondeu HTTP $code ($url), esperado regex '$expected_regex'"
  fi
}

echo "== Containers esperados em dev =="
check_container_running "npm-dev"
check_container_running "keycloak-dev"
check_container_running "keycloak-db-dev"
check_container_running "rabbitmq-dev"
check_container_running "redis-dev"
check_container_running "auth-dev"
check_container_running "notification-dev"
check_container_running "digao-oauth-portal-dev"

echo
echo "== Endpoints/portas em dev =="
check_http_up "NPM admin" "http://127.0.0.1:8181" '^(200|301|302)$'
check_http_up "Keycloak OIDC config" "http://127.0.0.1:8081/realms/digao-oauth-dev/.well-known/openid-configuration" '^200$'
check_http_up "Auth service porta" "http://127.0.0.1:8091" '^(200|401|403|404)$'
check_http_up "Notification service porta" "http://127.0.0.1:8082" '^(200|401|403|404)$'
check_http_up "RabbitMQ management" "http://127.0.0.1:15672" '^(200|401)$'

echo
echo "== Rede Docker =="
if docker network inspect npm_dev >/dev/null 2>&1; then
  ok "rede docker npm_dev existe"
else
  fail "rede docker npm_dev nao existe"
fi

echo
if [[ "$failures" -gt 0 ]]; then
  echo "Resultado: $failures falha(s) detectada(s)."
  exit 1
fi

echo "Resultado: dev pronto para validacao funcional."
