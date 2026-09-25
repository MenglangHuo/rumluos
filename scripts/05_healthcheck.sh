#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

show_usage() {
  cat <<'EOF'
Usage: ./scripts/05_healthcheck.sh [OPTIONS] [SERVICE...]

Run health checks for Rumluos services. If no services are specified,
all running services are verified.

Arguments:
  SERVICE...             Optional service name(s) to check (e.g., backend, frontend, nginx, postgres)

Options:
  -h, --help             Show this help message and exit

Examples:
  ./scripts/05_healthcheck.sh                     # Check all services
  ./scripts/05_healthcheck.sh backend             # Check only backend
  ./scripts/05_healthcheck.sh frontend nginx      # Check frontend and nginx
EOF
}

TARGET_SERVICES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_usage
      exit 0
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        TARGET_SERVICES+=("$1")
        shift
      done
      break
      ;;
    -*)
      log_error "Unknown option: $1. Run with --help for usage."
      exit 1
      ;;
    *)
      TARGET_SERVICES+=("$1")
      shift
      ;;
  esac
done

require_command docker
require_command curl

log_step "Validating Docker Compose configuration"
validate_compose
log_info "Expected Rumluos version: ${APP_VERSION}"

contains_service() {
  local target="$1"
  shift
  local s
  for s in "$@"; do
    if [[ "${s}" == "${target}" ]]; then
      return 0
    fi
  done
  return 1
}

is_container_running() {
  local service="$1"
  [[ -n "$(compose ps --status running -q "${service}" 2>/dev/null)" ]]
}

if [[ ${#TARGET_SERVICES[@]} -gt 0 ]]; then
  validate_services "${TARGET_SERVICES[@]}"
  log_info "Container status for: ${TARGET_SERVICES[*]}"
  compose ps "${TARGET_SERVICES[@]}"

  if contains_service "backend" "${TARGET_SERVICES[@]}"; then
    log_info "Backend health"
    compose exec -T backend sh -c 'wget -qO- http://localhost:8080/actuator/health'
    echo
    log_info "Backend version"
    compose exec -T backend sh -c 'wget -qO- http://localhost:8080/actuator/info'
    echo
  fi

  if contains_service "frontend" "${TARGET_SERVICES[@]}"; then
    log_info "Frontend health"
    if is_container_running "nginx"; then
      curl --fail --silent --show-error --max-time 10 http://localhost/ >/dev/null
      log_success "Frontend is reachable via Nginx"
    else
      compose exec -T frontend wget -qO- http://localhost:3000/ >/dev/null
      log_success "Frontend container is reachable"
    fi
  fi

  if contains_service "nginx" "${TARGET_SERVICES[@]}"; then
    log_info "Nginx health"
    curl --fail --silent --show-error --max-time 10 http://localhost/healthz >/dev/null
    log_success "Nginx is healthy (/healthz responded OK)"
  fi

  if contains_service "postgres" "${TARGET_SERVICES[@]}"; then
    log_info "PostgreSQL health"
    compose exec -T postgres pg_isready
    log_success "PostgreSQL is ready"
  fi
else
  log_info "Container status"
  compose ps

  log_info "Backend health"
  compose exec -T backend sh -c 'wget -qO- http://localhost:8080/actuator/health'
  echo
  log_info "Backend version"
  compose exec -T backend sh -c 'wget -qO- http://localhost:8080/actuator/info'
  echo

  log_info "Frontend health"
  curl --fail --silent --show-error --max-time 10 http://localhost/ >/dev/null
  log_success "Frontend is reachable"
fi

