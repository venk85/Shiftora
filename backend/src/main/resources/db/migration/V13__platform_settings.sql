create table platform_settings (
  setting_key varchar(80) primary key,
  setting_value jsonb not null,
  updated_at bigint not null
);
