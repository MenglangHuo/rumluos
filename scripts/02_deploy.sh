#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

show_usage() {
  cat <<'EOF'
Usage: ./scripts/02_deploy.sh [OPTIONS] [SERVICE...]

Start/deploy Rumluos services using Docker Compose. If no services are
specified, all default services are started.

Arguments:
  SERVICE...             Optional service name(s) to deploy (e.g., frontend, backend, nginx)

Options:
  --build                Build images before starting containers
  --no-deps              Don't start linked/dependent services
  --force-recreate       Recreate containers even if config/image haven't changed
  --skip-healthcheck     Skip service health checks after deployment
  -h, --help             Show this help message and exit

Examples:
  ./scripts/02_deploy.sh                     # Deploy all services and run health checks
  ./scripts/02_deploy.sh frontend            # Deploy frontend (and its dependencies)
  ./scripts/02_deploy.sh backend             # Deploy backend
  ./scripts/02_deploy.sh backend nginx       # Deploy backend and nginx
  ./scripts/02_deploy.sh --build frontend    # Build and deploy frontend
  ./scripts/02_deploy.sh --no-deps frontend  # Deploy only frontend container without dependencies
  ./scripts/02_deploy.sh --skip-healthcheck  # Deploy all services without running health checks
EOF
}

TARGET_SERVICES=()
DEPLOY_ARGS=("-d")
SKIP_HEALTHCHECK=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_usage
      exit 0
      ;;
    --build)
      DEPLOY_ARGS+=("--build")
      shift
      ;;
    --no-deps)
      DEPLOY_ARGS+=("--no-deps")
      shift
      ;;
    --force-recreate)
      DEPLOY_ARGS+=("--force-recreate")
      shift
      ;;
    --skip-healthcheck|--no-healthcheck)
      SKIP_HEALTHCHECK=true
      shift
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
log_info "Rumluos version: ${APP_VERSION}"

log_step "Validating Docker Compose configuration"
validate_compose

if [[ ${#TARGET_SERVICES[@]} -gt 0 ]]; then
  validate_services "${TARGET_SERVICES[@]}"
  log_step "Starting Rumluos service(s): ${TARGET_SERVICES[*]}"
  compose up "${DEPLOY_ARGS[@]}" "${TARGET_SERVICES[@]}"
  log_success "Service(s) started: ${TARGET_SERVICES[*]}"
  
  if [[ "${SKIP_HEALTHCHECK}" != "true" ]]; then
    log_step "Running service health checks for: ${TARGET_SERVICES[*]}"
    "${SCRIPT_DIR}/05_healthcheck.sh" "${TARGET_SERVICES[@]}"
  fi
else
  log_step "Starting all Rumluos services"
  compose up "${DEPLOY_ARGS[@]}"
  log_success "All containers started"
  
  if [[ "${SKIP_HEALTHCHECK}" != "true" ]]; then
    log_step "Running service health checks"
    "${SCRIPT_DIR}/05_healthcheck.sh"
  fi
fi
