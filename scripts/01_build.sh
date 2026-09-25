#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

show_usage() {
  cat <<'EOF'
Usage: ./scripts/01_build.sh [OPTIONS] [SERVICE...]

Build Docker images for Rumluos services. If no services are specified,
all buildable services defined in docker-compose are built.

Arguments:
  SERVICE...             Optional service name(s) to build (e.g., frontend, backend, nginx)

Options:
  --no-cache             Do not use cache when building images
  --pull                 Always attempt to pull a newer version of the image
  -h, --help             Show this help message and exit

Examples:
  ./scripts/01_build.sh                     # Build all services
  ./scripts/01_build.sh frontend            # Build only frontend
  ./scripts/01_build.sh backend             # Build only backend
  ./scripts/01_build.sh frontend backend    # Build both frontend and backend
  ./scripts/01_build.sh --no-cache backend  # Build backend without cache
EOF
}

TARGET_SERVICES=()
BUILD_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_usage
      exit 0
      ;;
    --no-cache)
      BUILD_ARGS+=("--no-cache")
      shift
      ;;
    --pull)
      BUILD_ARGS+=("--pull")
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
  log_step "Building Rumluos image(s): ${TARGET_SERVICES[*]}"
  compose build ${BUILD_ARGS[@]+"${BUILD_ARGS[@]}"} "${TARGET_SERVICES[@]}"
  log_success "Build completed for: ${TARGET_SERVICES[*]}"
else
  log_step "Building all Rumluos images"
  compose build ${BUILD_ARGS[@]+"${BUILD_ARGS[@]}"}
  log_success "Build completed for all services"
fi
