#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <section> <key> [file]" >&2
  exit 1
fi

SECTION="$1"
KEY="$2"
FILE="${3:-/data/apps/pulumi/.secrets.local}"

if [[ ! -f "$FILE" ]]; then
  echo "Secrets file not found: $FILE" >&2
  exit 1
fi

awk -v section="[$SECTION]" -v key="$KEY" '
$0==section {inside=1; next}
inside && /^\[/ {inside=0}
inside && index($0, key "=")==1 { print substr($0, length(key)+2); found=1; exit }
END { if (!found) exit 2 }
' "$FILE"
