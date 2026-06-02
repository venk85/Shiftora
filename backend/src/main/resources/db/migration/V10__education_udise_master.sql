create table education_states (
  state_code char(2) primary key,
  state_name varchar(100) not null,
  block_officer_title varchar(50) not null,
  district_officer_title varchar(50) not null,
  block_unit_name varchar(50) not null,
  udise_block_digits integer not null default 2
);

create table educational_districts (
  udise_district_code char(4) primary key,
  state_code char(2) not null references education_states(state_code),
  district_name varchar(100) not null,
  deo_office_name varchar(200) not null,
  deo_contact varchar(50)
);

create table education_blocks (
  udise_block_code varchar(7) primary key,
  udise_district_code char(4) not null references educational_districts(udise_district_code),
  state_code char(2) not null references education_states(state_code),
  block_name varchar(100) not null,
  beo_office_name varchar(200) not null,
  beo_contact varchar(50)
);

create table registered_schools (
  udise_code char(11) primary key,
  tenant_id varchar(64) references tenants(id) on delete set null,
  school_name varchar(200) not null,
  state_code char(2) not null references education_states(state_code),
  udise_district_code char(4) not null references educational_districts(udise_district_code),
  udise_block_code varchar(7) not null references education_blocks(udise_block_code),
  assignment_status varchar(40) not null,
  review_reason varchar(400),
  created_at bigint not null,
  updated_at bigint not null
);

create table education_assignment_reviews (
  id varchar(64) primary key,
  tenant_id varchar(64) references tenants(id) on delete cascade,
  udise_code varchar(11),
  status varchar(40) not null,
  reason varchar(400) not null,
  payload jsonb not null,
  created_at bigint not null
);

create index idx_edu_district_state on educational_districts(state_code);
create index idx_edu_blocks_district on education_blocks(udise_district_code);
create index idx_registered_schools_tenant on registered_schools(tenant_id);
create index idx_edu_reviews_status on education_assignment_reviews(status, created_at desc);
