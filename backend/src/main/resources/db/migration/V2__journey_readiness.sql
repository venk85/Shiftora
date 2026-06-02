create table app_users (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  email varchar(160) not null,
  name varchar(160) not null,
  role varchar(40) not null,
  avatar varchar(12) not null,
  profile jsonb not null,
  created_at bigint not null,
  unique (tenant_id, email)
);

create table user_assignments (
  id varchar(64) primary key,
  user_id varchar(64) not null references app_users(id) on delete cascade,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  school_name varchar(160) not null,
  grade varchar(40) not null,
  division varchar(40) not null,
  subject varchar(80) not null,
  responsibility varchar(80) not null,
  primary_assignment boolean not null,
  active boolean not null,
  metadata jsonb not null
);

create table readiness_templates (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  name varchar(160) not null,
  description varchar(400) not null,
  status varchar(24) not null,
  sort_order integer not null,
  targeting jsonb not null,
  questions jsonb not null,
  created_at bigint not null,
  updated_at bigint not null
);

create table readiness_attempts (
  id varchar(64) primary key,
  user_id varchar(64) not null references app_users(id) on delete cascade,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  template_id varchar(64) not null references readiness_templates(id) on delete cascade,
  assignment_id varchar(64) not null references user_assignments(id) on delete cascade,
  answers jsonb not null,
  score integer not null,
  level varchar(80) not null,
  recommended_modules jsonb not null,
  created_at bigint not null
);

create table journey_progress (
  id varchar(64) primary key,
  user_id varchar(64) not null references app_users(id) on delete cascade,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  assignment_id varchar(64) references user_assignments(id) on delete cascade,
  step_key varchar(80) not null,
  status varchar(32) not null,
  progress integer not null,
  score integer,
  updated_at bigint not null,
  unique (user_id, tenant_id, assignment_id, step_key)
);

create index idx_app_users_tenant_email on app_users(tenant_id, email);
create index idx_user_assignments_user on user_assignments(user_id, active);
create index idx_user_assignments_target on user_assignments(tenant_id, grade, division, subject);
create index idx_user_assignments_metadata on user_assignments using gin (metadata);
create index idx_readiness_templates_tenant on readiness_templates(tenant_id, status, sort_order);
create index idx_readiness_templates_targeting on readiness_templates using gin (targeting);
create index idx_readiness_attempts_user_created on readiness_attempts(user_id, tenant_id, created_at desc);
create index idx_readiness_attempts_answers on readiness_attempts using gin (answers);
create index idx_journey_progress_user on journey_progress(user_id, tenant_id, assignment_id);
