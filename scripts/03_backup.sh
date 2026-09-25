#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

require_command docker
log_step "Validating Docker Compose configuration"
validate_compose
BACKUP_DIR="${ROOT_DIR}/backups"
mkdir -p "${BACKUP_DIR}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="${BACKUP_DIR}/rumluos_${STAMP}.dump"

POSTGRES_HOST="$(get_env POSTGRES_HOST postgres)"
POSTGRES_PORT="$(get_env POSTGRES_PORT 5432)"
POSTGRES_USER="$(get_env POSTGRES_USER rumluos)"
POSTGRES_DB="$(get_env POSTGRES_DB rumluos_db)"
POSTGRES_PASSWORD="$(get_env POSTGRES_PASSWORD)"

if [[ "${POSTGRES_HOST}" == "postgres" || "${POSTGRES_HOST}" == "localhost" || "${POSTGRES_HOST}" == "127.0.0.1" ]]; then
  log_step "Creating local PostgreSQL backup: ${BACKUP_FILE}"
  compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "${BACKUP_FILE}"
else
  log_step "Creating remote PostgreSQL backup from ${POSTGRES_HOST}:${POSTGRES_PORT}: ${BACKUP_FILE}"
  docker run --rm -i \
    --network rumluos \
    -e PGPASSWORD="${POSTGRES_PASSWORD}" \
    postgres:17-alpine \
    pg_dump -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --format=custom > "${BACKUP_FILE}"
fi

log_success "Backup completed: ${BACKUP_FILE}"
