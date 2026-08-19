#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

require_command docker
TARGET_VERSION="${1:-}"
if [[ -z "${TARGET_VERSION}" || ! "${TARGET_VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
  log_error "Usage: $0 <version>, for example: $0 0.1.0"
  exit 1
fi

if [[ "${CONFIRM_ROLLBACK:-}" != "1" ]]; then
  log_warn "Rollback changes the active version from ${APP_VERSION} to ${TARGET_VERSION}."
  log_warn "Set CONFIRM_ROLLBACK=1 to continue."
  exit 1
fi

BACKEND_IMAGE="rumluos-backend:${TARGET_VERSION}"
FRONTEND_IMAGE="rumluos-frontend:${TARGET_VERSION}"
if ! docker image inspect "${BACKEND_IMAGE}" >/dev/null 2>&1; then
  log_error "Missing image: ${BACKEND_IMAGE}. Build or pull this version first."
  exit 1
fi
if ! docker image inspect "${FRONTEND_IMAGE}" >/dev/null 2>&1; then
  log_error "Missing image: ${FRONTEND_IMAGE}. Build or pull this version first."
  exit 1
fi

log_step "Switching active version to ${TARGET_VERSION}"
printf '%s\n' "${TARGET_VERSION}" > "${VERSION_FILE}"
export APP_VERSION="${TARGET_VERSION}"
validate_compose
compose up -d --no-build
log_success "Rollback deployed: ${TARGET_VERSION}"
log_step "Running service health checks"
"${SCRIPT_DIR}/05_healthcheck.sh"
