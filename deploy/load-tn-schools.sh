#!/usr/bin/env bash
# Load TN school master data into the running postgres container.
# Run from the repo root: bash deploy/load-tn-schools.sh [container-name]
set -e

CONTAINER=${1:-shiftora-local-postgres-1}
DB_USER=${POSTGRES_USER:-shiftora}
DB_NAME=${POSTGRES_DB:-shiftora}
SRC="tn_govt_fully_aided_schools_udise.txt"

if [ ! -f "$SRC" ]; then
  echo "ERROR: $SRC not found. Run from the repo root." >&2
  exit 1
fi

echo "Copying $SRC into $CONTAINER..."
docker cp "$SRC" "$CONTAINER:/tmp/$SRC"

echo "Running COPY into tn_school_master..."
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
  -c "COPY tn_school_master (district_name, block_name, school_type, school_name, udise_code, teaching_staff)
      FROM '/tmp/$SRC'
      WITH (FORMAT csv, DELIMITER '|', HEADER true);"

echo "Done. Row count:"
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
  -c "SELECT count(*) AS loaded_schools FROM tn_school_master;"
