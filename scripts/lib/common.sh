#!/usr/bin/env bash
set -Eeuo pipefail

# Colored logs are enabled for interactive terminals and disabled in CI/log files.
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  C_RESET=$'\033[0m'
  C_BLUE=$'\033[1;34m'
  C_GREEN=$'\033[1;32m'
  C_YELLOW=$'\033[1;33m'
  C_RED=$'\033[1;31m'
  C_CYAN=$'\033[1;36m'
else
  C_RESET="" C_BLUE="" C_GREEN="" C_YELLOW="" C_RED="" C_CYAN=""
fi

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log_info() { printf '%s %sℹ️  %s%s\n' "$(timestamp)" "${C_BLUE}" "$*" "${C_RESET}"; }
log_step() { printf '%s %s▶️  %s%s\n' "$(timestamp)" "${C_CYAN}" "$*" "${C_RESET}"; }
log_success() { printf '%s %s✅ %s%s\n' "$(timestamp)" "${C_GREEN}" "$*" "${C_RESET}"; }
log_warn() { printf '%s %s⚠️  %s%s\n' "$(timestamp)" "${C_YELLOW}" "$*" "${C_RESET}" >&2; }
log_error() { printf '%s %s❌ %s%s\n' "$(timestamp)" "${C_RED}" "$*" "${C_RESET}" >&2; }

trap 'log_error "Command failed at line ${BASH_LINENO[0]}: ${BASH_COMMAND}"' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
COMPOSE_FILE="${ROOT_DIR}/docker/docker-compose.yaml"
VERSION_FILE="${ROOT_DIR}/VERSION"

if [[ ! -f "${VERSION_FILE}" ]]; then
  log_error "Missing ${VERSION_FILE}."
  exit 1
fi
APP_VERSION="$(tr -d '[:space:]' < "${VERSION_FILE}")"
if [[ ! "${APP_VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
  log_error "Invalid version in ${VERSION_FILE}: ${APP_VERSION}"
  exit 1
fi
export APP_VERSION

if [[ ! -f "${ENV_FILE}" ]]; then
  log_error "Missing ${ENV_FILE}. Copy .env.example to .env and fill in the secrets."
  exit 1
fi

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

validate_compose() {
  compose config >/dev/null
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    log_error "Required command not found: $1"
    exit 1
  }
}
