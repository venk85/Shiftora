# Shiftora Database Design

Shiftora uses PostgreSQL 16 with Flyway migrations under `backend/src/main/resources/db/migration`.
The model is relational for identity, tenancy, assignments and progress, with JSONB for configurable content such as tenant settings, AI scenarios, templates, questions, answers and learning unit content.

## Core Principles

- Every operational record is scoped by `tenant_id` unless it is a platform or education master-data table.
- Education users can have multiple `user_assignments`; learner readiness, workshop completion, knowledge check and certificate status are stored at programme level by allowing `assignment_id` to be `null`.
- Admin-authored configurations are stored in tables, not frontend constants.
- JSONB fields are indexed with GIN where they are searched or filtered.
- All schema changes must be added as new Flyway migrations; do not edit old migrations after they have run in an environment.

## Entity Groups

| Area | Tables | Purpose |
|---|---|---|
| Tenant and app config | `tenants`, `platform_settings`, `scenarios`, `practice_entries` | Multi-sector organizations, platform language controls, AI sandbox scenarios, saved sandbox runs |
| Users and teaching context | `platform_users`, `auth_sessions`, `app_users`, `user_assignments` | Super-admin identity, signed sessions, school admins, teachers and their grade/division/subject responsibilities |
| Readiness journey | `readiness_templates`, `readiness_attempts`, `journey_progress` | School-admin configured readiness checks and teacher-level progress |
| Learning path | `learning_modules`, `learning_units`, `learning_progress` | Self-paced modules, module units and learner progress |
| Workshop/certification | `workshop_sessions`, `workshop_completions`, `knowledge_checks`, `knowledge_check_attempts`, `certificates` | Live workshop, knowledge checks, eligibility and generated certificates |
| Education master data | `education_states`, `educational_districts`, `education_blocks`, `registered_schools`, `education_assignment_reviews` | UDISE/BEO/DEO mapping and school auto-assignment review |

## Tables

### `tenants`

Stores each organization/school/sector tenant.

Key columns:
- `id`: primary key.
- `name`, `abbr`, `type`, `industry`: display and sector classification.
- `size`, `maturity`, `adoption`: aggregate metrics. `size` is reset to actual `app_users` count by migration `V8`.
- `seeded`: marks demo seed data.
- `config jsonb`: tenant-specific configuration such as school address, board, role labels, enabled languages, subdivisions and AI settings.

Indexes:
- `idx_tenants_industry`
- `idx_tenants_name_search`
- `idx_tenants_config` GIN

### `scenarios`

Stores sandbox scenarios by sector.

Key columns:
- `id`: scenario id such as worksheet generator or lesson plan lab.
- `industry`: sector filter.
- `title`, `description`, `icon`, `sort_order`: UI metadata.
- `config jsonb`: inputs, score labels, prompt/system instructions and scenario-specific settings.

Indexes:
- `idx_scenarios_industry`
- `idx_scenarios_config` GIN

### `platform_settings`

Stores platform-wide settings that must not live in browser local storage.

Key columns:
- `setting_key`: primary key, for example `language_access`.
- `setting_value jsonb`: enabled language list and default active language.
- `updated_at`: epoch milliseconds.

### `platform_users`

Stores super-admin accounts that are not scoped to a tenant.

Key columns:
- `email`: unique login identifier.
- `name`, `avatar`, `active`: display and lifecycle fields.
- `password_hash`: BCrypt hash. Raw passwords are never returned by the API.
- `failed_login_count`, `locked_until`, `last_login_at`: login protection metadata.

### `auth_sessions`

Stores backend-issued opaque login sessions.

Key columns:
- `principal_type`: `PLATFORM` or `APP`.
- `principal_id`, `tenant_id`, `role`: resolved identity context.
- `token_hash`: SHA-256 hash of the bearer token; raw session tokens are never stored.
- `expires_at`, `revoked_at`, `last_seen_at`: session lifecycle.

Indexes:
- `idx_auth_sessions_token`
- `idx_auth_sessions_principal`

### `practice_entries`

Stores teacher sandbox runs.

Key columns:
- `tenant_id`: owning tenant.
- `scenario_id`, `scenario_title`: scenario reference and snapshot label.
- `payload jsonb`: prompt inputs, AI output and scoring.
- `created_at`: epoch milliseconds.

Indexes:
- `idx_practice_tenant_created`
- `idx_practice_payload` GIN

### `app_users`

Stores platform, admin and learner accounts.

Key columns:
- `tenant_id`: owning tenant.
- `email`: unique per tenant.
- `name`, `role`, `avatar`: identity and role.
- `password_hash`: BCrypt hash for backend-authenticated login.
- `auth_version`, `failed_login_count`, `locked_until`, `last_login_at`: credential/session safety metadata.
- `profile jsonb`: designation, language preference and other sector-specific profile fields.

Constraints:
- Unique `(tenant_id, email)`.

Indexes:
- `idx_app_users_tenant_email`

### `user_assignments`

Stores a user's concrete work context. In education this is the school, grade, division, subject and responsibility.

Key columns:
- `user_id`, `tenant_id`
- `school_name`, `grade`, `division`, `subject`
- `responsibility`: teacher, HOD, principal, etc.
- `primary_assignment`: default assignment for personalization.
- `active`: assignment lifecycle flag.
- `metadata jsonb`: board, focus area, department, school details or sector-specific fields.

Indexes:
- `idx_user_assignments_user`
- `idx_user_assignments_target`
- `idx_user_assignments_metadata` GIN

### `readiness_templates`

School-admin configured readiness checks.

Key columns:
- `tenant_id`
- `name`, `description`, `status`, `sort_order`
- `targeting jsonb`: grade/subject/responsibility or programme-level targeting.
- `questions jsonb`: scale/single-choice/multi-choice/text questions with weights.

Indexes:
- `idx_readiness_templates_tenant`
- `idx_readiness_templates_targeting` GIN

### `readiness_attempts`

Teacher readiness submissions.

Key columns:
- `user_id`, `tenant_id`, `template_id`
- `assignment_id`: nullable. Current teacher journey uses `null` for one readiness score across all assigned grades/subjects.
- `answers jsonb`
- `score`, `level`, `recommended_modules jsonb`
- `created_at`

Indexes:
- `idx_readiness_attempts_user_created`
- `idx_readiness_attempts_answers` GIN
- `idx_readiness_attempts_user_programme` for programme-level attempts where `assignment_id is null`

### `journey_progress`

Tracks high-level journey steps.

Key columns:
- `user_id`, `tenant_id`
- `assignment_id`: nullable for programme-level steps.
- `step_key`: `assessment`, `learning`, `workshop`, `sandbox`, `practice`, `check`.
- `status`, `progress`, `score`, `updated_at`

Constraints:
- Unique `(user_id, tenant_id, assignment_id, step_key)`.

Indexes:
- `idx_journey_progress_user`

### `learning_modules`

Self-paced learning module definitions.

Key columns:
- `tenant_id`
- `title`, `description`, `level`, `language`
- `estimated_minutes`, `status`, `sort_order`
- `targeting jsonb`: readiness band, grade, subject or role filters.

Indexes:
- `idx_learning_modules_tenant`
- `idx_learning_modules_targeting` GIN

### `learning_units`

Units within a module.

Key columns:
- `module_id`
- `title`, `type`, `estimated_minutes`, `sort_order`
- `content jsonb`: summary, body, activity, quiz question and expected answer.

Indexes:
- `idx_learning_units_module`

### `learning_progress`

Learner progress at module/unit level.

Key columns:
- `user_id`, `tenant_id`, `assignment_id`
- `module_id`, `unit_id`
- `status`, `progress_percent`, `score`, `time_spent_seconds`
- `completed_at`, `updated_at`

Constraints:
- Unique `(user_id, assignment_id, module_id, unit_id)`.

Indexes:
- `idx_learning_progress_user`

### `workshop_sessions`

Admin-created live workshop sessions.

Key columns:
- `tenant_id`
- `title`, `status`, `starts_at`, `duration_minutes`
- `facilitator`, `meeting_url`, `attendee_count`
- `agenda jsonb`, `prerequisites jsonb`

Indexes:
- `idx_workshop_sessions_tenant_start`
- `idx_workshop_sessions_agenda` GIN

### `workshop_completions`

Admin-marked completion records.

Key columns:
- `user_id`, `tenant_id`
- `assignment_id`: nullable for programme-level completion.
- `status`, `completed_by`, `completed_at`, `notes`

Indexes:
- `idx_workshop_completions_user`
- `idx_workshop_completions_user_programme`

### `knowledge_checks`

Admin-triggered post-workshop checks.

Key columns:
- `tenant_id`
- `title`, `description`, `status`, `pass_score`, `sort_order`
- `targeting jsonb`
- `questions jsonb`

Indexes:
- `idx_knowledge_checks_tenant`
- `idx_knowledge_checks_targeting` GIN

### `knowledge_check_attempts`

Teacher knowledge check submissions.

Key columns:
- `user_id`, `tenant_id`
- `assignment_id`: nullable for programme-level check.
- `knowledge_check_id`
- `answers jsonb`, `score`, `passed`, `created_at`

Indexes:
- `idx_knowledge_attempts_user`
- `idx_knowledge_attempts_user_programme`

### `certificates`

Certificate generation/email records.

Key columns:
- `user_id`, `tenant_id`
- `assignment_id`: nullable for programme-level certificate.
- `certificate_number`, `status`
- `emailed_to`, `generated_by`, `generated_at`, `emailed_at`

Indexes:
- `idx_certificates_user`
- `idx_certificates_user_programme`

### `education_states`

State-level education master data.

Key columns:
- `state_code`, `state_name`
- `block_officer_title`, `district_officer_title`
- `block_unit_name`, `udise_block_digits`

### `educational_districts`

District master data.

Key columns:
- `udise_district_code`
- `state_code`
- `district_name`, `deo_office_name`, `deo_contact`

Indexes:
- `idx_edu_district_state`

### `education_blocks`

Block/mandal master data.

Key columns:
- `udise_block_code`
- `udise_district_code`, `state_code`
- `block_name`, `beo_office_name`, `beo_contact`

Indexes:
- `idx_edu_blocks_district`

### `registered_schools`

UDISE-linked school registry.

Key columns:
- `udise_code`
- `tenant_id`: nullable link to a Shiftora tenant.
- `school_name`
- `state_code`, `udise_district_code`, `udise_block_code`
- `assignment_status`, `review_reason`
- `created_at`, `updated_at`

Indexes:
- `idx_registered_schools_tenant`

### `education_assignment_reviews`

Audit/review table for school auto-assignment.

Key columns:
- `tenant_id`
- `udise_code`
- `status`, `reason`
- `payload jsonb`
- `created_at`

Indexes:
- `idx_edu_reviews_status`

## Main Relationships

- `tenants` owns `app_users`, `user_assignments`, `scenarios`, `practice_entries`, readiness, learning, workshop, knowledge and certificate records.
- `app_users` owns `user_assignments`, attempts, progress and certificate records.
- `user_assignments` describes the teacher's school/grade/division/subject context. Programme-level tables may use `assignment_id = null` when one result applies across all assignments.
- `readiness_templates` feed `readiness_attempts`.
- `learning_modules` contain `learning_units`; `learning_progress` links the learner to modules/units.
- `knowledge_checks` feed `knowledge_check_attempts`.
- Education master data links `education_states -> educational_districts -> education_blocks -> registered_schools`.

## pgAdmin Access

The Docker Compose stack includes pgAdmin for local/demo database inspection.

Start the stack:

```bash
POSTGRES_PASSWORD=shiftora POSTGRES_DB=shiftora POSTGRES_USER=shiftora HTTP_PORT=8090 API_PORT=18081 \
docker compose -p skillnavigator-ms --env-file .env.local -f docker-compose.azure-vm.yml up -d --build
```

Open pgAdmin:

```text
http://localhost:5050
```

Default pgAdmin login:

```text
Email: admin@shiftora.com
Password: shiftora-pgadmin
```

You can override these with:

```bash
PGADMIN_DEFAULT_EMAIL=<your-email>
PGADMIN_DEFAULT_PASSWORD=<strong-password>
PGADMIN_PORT=5050
```

Register the database server inside pgAdmin:

```text
Name: Shiftora local
Host: postgres
Port: 5432
Maintenance database: shiftora
Username: shiftora
Password: shiftora
```

For host tools such as a desktop pgAdmin/DataGrip connection, use:

```text
Host: 127.0.0.1
Port: 15432
Database: shiftora
Username: shiftora
Password: shiftora
```

The host Postgres and pgAdmin ports are bound to `127.0.0.1` in Compose so they are not exposed publicly by default on a VM. Use an SSH tunnel for Azure VM access.

## Git Hygiene

Do not commit files containing database or pgAdmin passwords.

Ignored by `.gitignore`:

- `.env`
- `.env.*`
- `*.local`
- `pgadmin-data/`
- `pgadmin-servers.json`
- `*.pgpass`
- `*.dump`
- `*.backup`

Keep real credentials in `.env.local` or `.env.azure`; these are intentionally ignored.
