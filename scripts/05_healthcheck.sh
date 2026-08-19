#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

require_command docker
require_command curl
log_step "Validating Docker Compose configuration"
validate_compose
log_info "Expected Rumluos version: ${APP_VERSION}"
log_info "Container status"
compose ps
log_info "Backend health"
compose exec -T backend sh -c 'wget -qO- http://localhost:8080/actuator/health'
echo
log_info "Backend version"
compose exec -T backend sh -c 'wget -qO- http://localhost:8080/actuator/info'
log_info "Frontend health"
curl --fail --silent --show-error --max-time 10 http://localhost/ >/dev/null
log_success "Frontend is reachable"
