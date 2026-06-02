create table workshop_completions (
  id varchar(64) primary key,
  user_id varchar(64) not null references app_users(id) on delete cascade,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  assignment_id varchar(64) not null references user_assignments(id) on delete cascade,
  status varchar(32) not null,
  completed_by varchar(160) not null,
  completed_at bigint not null,
  notes varchar(500) not null,
  unique (user_id, assignment_id)
);

create table knowledge_checks (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  title varchar(180) not null,
  description varchar(500) not null,
  status varchar(24) not null,
  pass_score integer not null,
  sort_order integer not null,
  targeting jsonb not null,
  questions jsonb not null,
  created_at bigint not null,
  updated_at bigint not null
);

create table knowledge_check_attempts (
  id varchar(64) primary key,
  user_id varchar(64) not null references app_users(id) on delete cascade,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  assignment_id varchar(64) not null references user_assignments(id) on delete cascade,
  knowledge_check_id varchar(64) not null references knowledge_checks(id) on delete cascade,
  answers jsonb not null,
  score integer not null,
  passed boolean not null,
  created_at bigint not null
);

create table certificates (
  id varchar(64) primary key,
  user_id varchar(64) not null references app_users(id) on delete cascade,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  assignment_id varchar(64) not null references user_assignments(id) on delete cascade,
  certificate_number varchar(80) not null,
  status varchar(32) not null,
  emailed_to varchar(160) not null,
  generated_by varchar(160) not null,
  generated_at bigint not null,
  emailed_at bigint,
  unique (user_id, assignment_id)
);

create index idx_workshop_completions_user on workshop_completions(user_id, tenant_id, assignment_id);
create index idx_knowledge_checks_tenant on knowledge_checks(tenant_id, status, sort_order);
create index idx_knowledge_checks_targeting on knowledge_checks using gin (targeting);
create index idx_knowledge_attempts_user on knowledge_check_attempts(user_id, tenant_id, assignment_id, created_at desc);
create index idx_certificates_user on certificates(user_id, tenant_id, assignment_id);
