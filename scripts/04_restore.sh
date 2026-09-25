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

POSTGRES_HOST="$(get_env POSTGRES_HOST postgres)"
POSTGRES_PORT="$(get_env POSTGRES_PORT 5432)"
POSTGRES_USER="$(get_env POSTGRES_USER rumluos)"
POSTGRES_DB="$(get_env POSTGRES_DB rumluos_db)"
POSTGRES_PASSWORD="$(get_env POSTGRES_PASSWORD)"

if [[ "${POSTGRES_HOST}" == "postgres" || "${POSTGRES_HOST}" == "localhost" || "${POSTGRES_HOST}" == "127.0.0.1" ]]; then
  log_step "Restoring to local PostgreSQL: ${BACKUP_FILE}"
  compose exec -T postgres sh -c 'pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "${BACKUP_FILE}"
else
  log_step "Restoring to remote PostgreSQL ${POSTGRES_HOST}:${POSTGRES_PORT}: ${BACKUP_FILE}"
  docker run --rm -i \
    --network rumluos \
    -e PGPASSWORD="${POSTGRES_PASSWORD}" \
    postgres:17-alpine \
    pg_restore --clean --if-exists --no-owner -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${BACKUP_FILE}"
fi

log_success "Restore completed"
