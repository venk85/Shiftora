alter table app_users
  add column if not exists password_hash varchar(120),
  add column if not exists auth_version integer not null default 0,
  add column if not exists failed_login_count integer not null default 0,
  add column if not exists locked_until bigint,
  add column if not exists last_login_at bigint;

create table platform_users (
  id varchar(64) primary key,
  email varchar(160) not null unique,
  name varchar(160) not null,
  avatar varchar(12) not null,
  password_hash varchar(120),
  auth_version integer not null default 0,
  failed_login_count integer not null default 0,
  locked_until bigint,
  last_login_at bigint,
  active boolean not null default true,
  created_at bigint not null
);

create table auth_sessions (
  id varchar(64) primary key,
  principal_type varchar(24) not null,
  principal_id varchar(64) not null,
  tenant_id varchar(64),
  token_hash varchar(128) not null unique,
  role varchar(40) not null,
  expires_at bigint not null,
  revoked_at bigint,
  created_at bigint not null,
  last_seen_at bigint not null
);

create index idx_auth_sessions_token on auth_sessions(token_hash);
create index idx_auth_sessions_principal on auth_sessions(principal_type, principal_id, expires_at desc);
