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

get_compose_services() {
  if [[ -z "${VALID_COMPOSE_SERVICES:-}" ]]; then
    VALID_COMPOSE_SERVICES="$(compose --profile "*" config --services 2>/dev/null || true)"
  fi
  printf '%s\n' "${VALID_COMPOSE_SERVICES}"
}

validate_services() {
  local all_services
  all_services="$(get_compose_services)"
  if [[ -z "${all_services}" ]]; then
    return 0
  fi

  local invalid=()
  local svc
  for svc in "$@"; do
    if ! grep -qxF "${svc}" <<< "${all_services}"; then
      invalid+=("${svc}")
    fi
  done

  if [[ ${#invalid[@]} -gt 0 ]]; then
    local valid_list
    valid_list="$(printf '%s\n' "${all_services}" | tr '\n' ' ' | sed -e 's/[[:space:]]*$//' -e 's/[[:space:]]\+/, /g')"
    log_error "Unknown service(s): ${invalid[*]}. Valid services are: ${valid_list}"
    exit 1
  fi
  return 0
}

get_env() {
  local key="$1"
  local default_val="${2:-}"
  local val
  val="$(grep -E "^${key}=" "${ENV_FILE}" 2>/dev/null | head -n 1 | cut -d= -f2- | tr -d '\r' || true)"
  if [[ -n "${val}" ]]; then
    printf '%s' "${val}"
  else
    printf '%s' "${default_val}"
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    log_error "Required command not found: $1"
    exit 1
  }
}
