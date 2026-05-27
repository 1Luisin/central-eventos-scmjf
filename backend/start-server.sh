#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAR_PATH="$SCRIPT_DIR/target/central-eventos-api-1.0.0.jar"

if [[ ! -f "$SCRIPT_DIR/datasource-local.properties" ]]; then
  echo "Crie o arquivo backend/datasource-local.properties antes de iniciar a API." >&2
  exit 1
fi

if [[ ! -f "$SCRIPT_DIR/auth-local.properties" ]]; then
  echo "Crie o arquivo backend/auth-local.properties antes de iniciar a API." >&2
  exit 1
fi

if [[ ! -f "$JAR_PATH" ]]; then
  echo "Build da API nao encontrado. Gerando pacote..."
  (cd "$SCRIPT_DIR" && mvn -q -DskipTests package)
fi

export SERVER_ADDRESS="${SERVER_ADDRESS:-0.0.0.0}"
export SERVER_PORT="${SERVER_PORT:-8006}"
export FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-http://127.0.0.1:4006}"

echo "Iniciando API em ${SERVER_ADDRESS}:${SERVER_PORT}..."
exec java -jar "$JAR_PATH"
