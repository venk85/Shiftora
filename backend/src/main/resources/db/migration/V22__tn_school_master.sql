-- Tamil Nadu school master table.
-- Schema only — data is loaded separately via psql COPY (see deploy/load-tn-schools.sql).

create table if not exists tn_school_master (
  udise_code       varchar(11) primary key,
  school_name      text        not null,
  district_name    text        not null,
  block_name       text        not null,
  school_type      text        not null,
  teaching_staff   int         not null default 0,
  state_code       varchar(2)  not null default '33'
);
