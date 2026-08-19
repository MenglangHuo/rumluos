#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

require_command docker
log_info "Rumluos version: ${APP_VERSION}"
log_step "Validating Docker Compose configuration"
validate_compose
log_step "Building Rumluos images"
compose build
log_success "Build completed"
