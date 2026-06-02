alter table readiness_attempts alter column assignment_id drop not null;
alter table workshop_completions alter column assignment_id drop not null;
alter table knowledge_check_attempts alter column assignment_id drop not null;
alter table certificates alter column assignment_id drop not null;

create index idx_readiness_attempts_user_programme on readiness_attempts(user_id, tenant_id, created_at desc) where assignment_id is null;
create index idx_workshop_completions_user_programme on workshop_completions(user_id, tenant_id) where assignment_id is null;
create index idx_knowledge_attempts_user_programme on knowledge_check_attempts(user_id, tenant_id, created_at desc) where assignment_id is null;
create index idx_certificates_user_programme on certificates(user_id, tenant_id) where assignment_id is null;
