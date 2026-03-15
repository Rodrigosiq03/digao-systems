#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

status=0

report() {
  local title="$1"
  shift
  echo "== $title =="
  if "$@"; then
    true
  else
    local exit_code=$?
    if [ "$exit_code" -eq 1 ]; then
      echo "ok"
    else
      exit "$exit_code"
    fi
  fi
  echo
}

if rg -n '^[A-Za-z0-9_.-]+(>=|>|<|~=)' pulumi/**/requirements.txt; then
  status=1
fi

if rg -n 'imageTag:\s*"latest"|image:\s*.+:latest\b|:[[:space:]]*latest\b' pulumi services deploy .github -g '!**/node_modules/**' -g '!pulumi/scripts/audit-version-governance.sh'; then
  status=1
fi

if rg -n 'uses:\s+[^@\s]+@(main|master|latest)\b' .github/workflows; then
  status=1
fi

if [ "$status" -ne 0 ]; then
  echo "version governance audit failed"
  exit 1
fi

echo "version governance audit passed"
