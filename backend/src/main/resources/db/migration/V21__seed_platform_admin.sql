-- Default platform admin user.
-- Password: Shiftora@123 (BCrypt, cost 10) — change after first login.
insert into platform_users (id, email, name, avatar, password_hash, active, created_at)
values (
  'pu-platform-admin',
  'admin@example.com',
  'Platform Admin',
  'PA',
  '$2a$10$WkY2vDjYkMtv.7gb34T94.VxnQU5O5cmO0nvOyQ8MiiavNvSJ2L/.',
  true,
  extract(epoch from now()) * 1000
)
on conflict (email) do nothing;
