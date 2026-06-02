create table learning_modules (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  title varchar(180) not null,
  description varchar(500) not null,
  level varchar(40) not null,
  language varchar(40) not null,
  estimated_minutes integer not null,
  status varchar(24) not null,
  sort_order integer not null,
  targeting jsonb not null,
  created_at bigint not null,
  updated_at bigint not null
);

create table learning_units (
  id varchar(64) primary key,
  module_id varchar(64) not null references learning_modules(id) on delete cascade,
  title varchar(180) not null,
  type varchar(40) not null,
  estimated_minutes integer not null,
  sort_order integer not null,
  content jsonb not null
);

create table learning_progress (
  id varchar(64) primary key,
  user_id varchar(64) not null references app_users(id) on delete cascade,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  assignment_id varchar(64) not null references user_assignments(id) on delete cascade,
  module_id varchar(64) not null references learning_modules(id) on delete cascade,
  unit_id varchar(64) references learning_units(id) on delete cascade,
  status varchar(32) not null,
  progress_percent integer not null,
  score integer,
  time_spent_seconds integer not null,
  completed_at bigint,
  updated_at bigint not null,
  unique (user_id, assignment_id, module_id, unit_id)
);

create index idx_learning_modules_tenant on learning_modules(tenant_id, status, sort_order);
create index idx_learning_modules_targeting on learning_modules using gin (targeting);
create index idx_learning_units_module on learning_units(module_id, sort_order);
create index idx_learning_progress_user on learning_progress(user_id, tenant_id, assignment_id, module_id);
