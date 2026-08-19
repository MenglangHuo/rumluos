#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

require_command docker
log_step "Validating Docker Compose configuration"
validate_compose
BACKUP_FILE="${1:-}"
if [[ -z "${BACKUP_FILE}" || ! -f "${BACKUP_FILE}" ]]; then
  log_error "Usage: $0 backups/rumluos_<timestamp>.dump"
  exit 1
fi
if [[ "${CONFIRM_RESTORE:-}" != "1" ]]; then
  log_warn "Restore replaces existing database data. Set CONFIRM_RESTORE=1 to continue."
  exit 1
fi

log_step "Restoring ${BACKUP_FILE}"
compose exec -T postgres sh -c 'pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "${BACKUP_FILE}"
log_success "Restore completed"
