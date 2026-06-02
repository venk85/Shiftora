create table workshop_sessions (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id) on delete cascade,
  title varchar(180) not null,
  status varchar(32) not null,
  starts_at bigint not null,
  duration_minutes integer not null,
  facilitator varchar(120) not null,
  meeting_url varchar(400) not null,
  attendee_count integer not null,
  agenda jsonb not null,
  prerequisites jsonb not null,
  created_at bigint not null,
  updated_at bigint not null
);

create index idx_workshop_sessions_tenant_start on workshop_sessions(tenant_id, starts_at);
create index idx_workshop_sessions_agenda on workshop_sessions using gin (agenda);
