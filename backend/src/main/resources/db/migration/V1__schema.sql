create table tenants (
  id varchar(64) primary key,
  name varchar(160) not null,
  abbr varchar(12) not null,
  type varchar(120) not null,
  size integer not null,
  industry varchar(24) not null,
  maturity integer not null,
  adoption integer not null,
  created_at bigint not null,
  config jsonb not null
);

create table scenarios (
  id varchar(80) primary key,
  industry varchar(24) not null,
  title varchar(160) not null,
  description varchar(400) not null,
  icon varchar(16) not null,
  sort_order integer not null,
  config jsonb not null
);

create table practice_entries (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  scenario_id varchar(80) not null,
  scenario_title varchar(160) not null,
  payload jsonb not null,
  created_at bigint not null
);

create index idx_tenants_industry on tenants(industry);
create index idx_tenants_name_search on tenants using gin (to_tsvector('english', name || ' ' || type));
create index idx_tenants_config on tenants using gin (config);
create index idx_scenarios_industry on scenarios(industry, sort_order);
create index idx_scenarios_config on scenarios using gin (config);
create index idx_practice_tenant_created on practice_entries(tenant_id, created_at desc);
create index idx_practice_payload on practice_entries using gin (payload);
