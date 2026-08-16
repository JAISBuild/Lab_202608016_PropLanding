#!/usr/bin/env bash
# PropLanding DB backup script (Phase 7)
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="${BACKUP_DIR}/proplanding_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL required"
  exit 1
fi

pg_dump "$DATABASE_URL" > "$FILE"
echo "Backup saved: $FILE"

# Keep last 7 days
find "$BACKUP_DIR" -name "proplanding_*.sql" -mtime +7 -delete 2>/dev/null || true
