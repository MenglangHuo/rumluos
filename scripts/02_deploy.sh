#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

require_command docker
log_info "Rumluos version: ${APP_VERSION}"
log_step "Validating Docker Compose configuration"
validate_compose
log_step "Starting Rumluos services"
compose up -d
log_success "Containers started"
log_step "Running service health checks"
"${SCRIPT_DIR}/05_healthcheck.sh"
