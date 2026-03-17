#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../../.." && pwd)"
service_dir="${repo_root}/services/go/cloud-gaming"
binary_path="${service_dir}/bin/cloud-gaming"

env_file="${1:-${script_dir}/cloud-gaming.host.env}"

if [[ ! -f "${env_file}" ]]; then
  echo "[ERR] arquivo de env nao encontrado: ${env_file}" >&2
  echo "[INFO] copie de: ${script_dir}/cloud-gaming.host.env.example" >&2
  exit 1
fi

set -a
source "${env_file}"
set +a

echo "[INFO] iniciando backend cloud-gaming em host mode"
echo "[INFO] env=${env_file}"
echo "[INFO] service_dir=${service_dir}"

cd "${service_dir}"
if command -v go >/dev/null 2>&1; then
  echo "[INFO] executando via go run"
  exec go run ./cmd/server
fi

if [[ -x "${binary_path}" ]]; then
  echo "[INFO] executando binario precompilado ${binary_path}"
  exec "${binary_path}"
fi

echo "[ERR] Go nao encontrado e binario ausente em ${binary_path}" >&2
echo "[INFO] gere com: docker run --rm -u \"\$(id -u):\$(id -g)\" -v ${service_dir}:/src -w /src golang:1.22 sh -lc 'export PATH=\$PATH:/usr/local/go/bin && mkdir -p bin && CGO_ENABLED=0 GOOS=linux go build -o ./bin/cloud-gaming ./cmd/server'" >&2
exit 1
