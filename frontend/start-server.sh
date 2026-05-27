#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Crie o arquivo frontend/.env.local antes de iniciar o frontend." >&2
  exit 1
fi

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-4006}"

cd "$SCRIPT_DIR"

echo "Gerando build do frontend..."
npm run build

echo "Iniciando frontend em http://${HOSTNAME}:${PORT}..."
exec npm run start
