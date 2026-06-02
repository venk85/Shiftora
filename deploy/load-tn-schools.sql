-- Server-side COPY — run after docker cp copies the source file into the container.
-- See instructions below or run deploy/load-tn-schools.sh

COPY tn_school_master (district_name, block_name, school_type, school_name, udise_code, teaching_staff)
  FROM '/tmp/tn_govt_fully_aided_schools_udise.txt'
  WITH (FORMAT csv, DELIMITER '|', HEADER true);

SELECT count(*) AS loaded_schools FROM tn_school_master;
