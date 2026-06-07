-- =============================================================================
-- Shiftora — Azure Demo Seed Data
-- =============================================================================
-- Run ONCE on the Azure VM after the first `docker compose up`:
--
--   docker exec -i shiftora-postgres-1 \
--     psql -U shiftora -d shiftora < deploy/seed_azure_demo.sql
--
-- All passwords are:  Shiftora@123  (BCrypt cost 12)
-- Safe to re-run — every statement uses ON CONFLICT DO NOTHING.
-- =============================================================================

-- ── PLATFORM ADMIN ──────────────────────────────────────────────────────────
-- Login at /login with:  admin@shiftora.edu.in  /  Shiftora@123
INSERT INTO platform_users (id, email, name, avatar, password_hash, active, created_at)
VALUES (
  'pu-platform-admin',
  'admin@shiftora.edu.in',
  'Platform Admin',
  'PA',
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  true,
  extract(epoch from now()) * 1000
)
ON CONFLICT (email) DO NOTHING;

-- ── TENANT ───────────────────────────────────────────────────────────────────
-- PUPS, IKKADU KANDIGAI — Government primary school, Thiruvallur, Tamil Nadu
INSERT INTO tenants (id, name, abbr, type, size, industry, maturity, adoption, created_at, config)
VALUES (
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'PUPS, IKKADU KANDIGAI',
  'PU',
  'Government',
  1,
  'edu',
  0,
  0,
  extract(epoch from now()) * 1000,
  '{
    "board": "Tamil Nadu State Board",
    "aiName": "Shiksha AI",
    "location": {
      "city": "THIRUVALLUR",
      "state": "TAMILNADU",
      "country": "India",
      "pincode": "",
      "district": "TIRUVALLUR",
      "addressLine1": "Ikkadu Kandigai, Thiruvallur",
      "addressLine2": ""
    },
    "personas": {
      "hod":       { "name": "TBD",         "title": "HOD · Academic",        "avatar": "T"  },
      "admin":     { "name": "Admin User",   "title": "School Admin",          "avatar": "AU" },
      "learner":   { "name": "Team Member",  "title": "Teacher · Academic",    "avatar": "TM" },
      "principal": { "name": "Leadership",   "title": "Principal",             "avatar": "LD" }
    },
    "udiseCode": "33010100901",
    "brandColor": "#4069F0",
    "roleLabels": ["Platform", "School Admin", "Principal", "HOD", "Teacher"],
    "subdivisions": [{
      "id": "ZKg8_1cz",
      "hod": "TBD",
      "name": "Academic",
      "staff": 0,
      "adoption": 0,
      "leadRole": "Academic lead",
      "maturity": 0,
      "description": "Default school academic group. Configure classes, teachers, HODs and sections from School Admin."
    }],
    "aiInstruction": "Respond as a helpful, classroom-ready co-teacher. Keep examples grade-aware and board-aligned.",
    "subdivisionNoun": "Departments",
    "schoolPhotoDataUrl": "",
    "educationAssignment": {
      "status": "ASSIGNED",
      "message": "School details loaded from UDISE master",
      "blockName": "THIRUVALLUR",
      "boardName": "Tamil Nadu State Board",
      "stateCode": "33",
      "stateName": "TAMILNADU",
      "udiseCode": "33010100901",
      "schoolName": "PUPS, IKKADU KANDIGAI",
      "schoolType": "Government",
      "staffCount": 2,
      "districtName": "TIRUVALLUR",
      "blockUnitName": "Block",
      "udiseBlockCode": "330101",
      "blockOfficerTitle": "Block-level education authority",
      "udiseDistrictCode": "3301",
      "blockOfficerOffice": "THIRUVALLUR Block education authority",
      "blockOfficerContact": "",
      "districtOfficerTitle": "District-level education authority",
      "districtOfficerOffice": "TIRUVALLUR District education authority",
      "districtOfficerContact": ""
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ── APP USERS ─────────────────────────────────────────────────────────────────
-- All passwords: Shiftora@123

-- School Admin (demoadmin@dps.com)
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, auth_version, created_at)
VALUES (
  'u-eb10bf69',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'demoadmin@dps.com',
  'Demo Admin',
  'ADMIN',
  'DA',
  '{"status": "active", "designation": "School Admin"}'::jsonb,
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  0,
  extract(epoch from now()) * 1000
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Teacher / Learner (demoteacher@dps.com)
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, auth_version, created_at)
VALUES (
  'u-8e5eb21c',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'demoteacher@dps.com',
  'DemoTeacher',
  'TEACHER',
  'D',
  '{"status": "active", "language": "Tamil + English", "designation": "Subject Teacher"}'::jsonb,
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  0,
  extract(epoch from now()) * 1000
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- DEO — District Education Officer (deo@shiftora.edu.in)
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, auth_version, created_at)
VALUES (
  'u-9d802bcf',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'deo@shiftora.edu.in',
  'Rajiv Kumar',
  'DEO',
  'RK',
  '{"status": "active", "designation": "District Education Officer", "officerScope": "DEO", "stateCode": "33", "stateName": "TAMILNADU", "districtName": "TIRUVALLUR", "udiseDistrictCode": "3301", "blockName": "", "udiseBlockCode": ""}'::jsonb,
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  0,
  extract(epoch from now()) * 1000
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- BEO — Block Education Officer (beo@shiftora.edu.in)
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, auth_version, created_at)
VALUES (
  'u-0ffb7baf',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'beo@shiftora.edu.in',
  'Suresh Babu',
  'BEO',
  'SB',
  '{"status": "active", "designation": "Block Education Officer", "officerScope": "BEO", "stateCode": "33", "stateName": "TAMILNADU", "districtName": "TIRUVALLUR", "udiseDistrictCode": "3301", "blockName": "THIRUVALLUR", "udiseBlockCode": "330101"}'::jsonb,
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  0,
  extract(epoch from now()) * 1000
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- School Admin 2 (schooladmin@shiftora.edu.in)
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, auth_version, created_at)
VALUES (
  'u-abfc5369',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'schooladmin@shiftora.edu.in',
  'Vivek Singh',
  'ADMIN',
  'VS',
  '{"status": "active", "language": "Tamil + English", "designation": "School Admin"}'::jsonb,
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  0,
  extract(epoch from now()) * 1000
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Principal (principal@shiftora.edu.in)
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, auth_version, created_at)
VALUES (
  'u-2f798b20',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'principal@shiftora.edu.in',
  'Dr. R. Sharma',
  'PRINCIPAL',
  'DR',
  '{"status": "active", "language": "Tamil + English", "designation": "Principal"}'::jsonb,
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  0,
  extract(epoch from now()) * 1000
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- HOD (hod@shiftora.edu.in)
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, auth_version, created_at)
VALUES (
  'u-f905304f',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'hod@shiftora.edu.in',
  'Sunita Menon',
  'HOD',
  'SM',
  '{"status": "active", "language": "Tamil + English", "designation": "HOD"}'::jsonb,
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  0,
  extract(epoch from now()) * 1000
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Teacher 2 (teacher@shiftora.edu.in)
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, auth_version, created_at)
VALUES (
  'u-51390bed',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'teacher@shiftora.edu.in',
  'Ms. Ananya Krishnan',
  'TEACHER',
  'MA',
  '{"status": "active", "language": "Tamil + English", "designation": "Subject Teacher"}'::jsonb,
  '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W',
  0,
  extract(epoch from now()) * 1000
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ── USER ASSIGNMENT ───────────────────────────────────────────────────────────
-- demoteacher@dps.com → Grade 1 A · Mathematics · Subject Teacher
INSERT INTO user_assignments (id, user_id, tenant_id, school_name, grade, division, subject, responsibility, primary_assignment, active, metadata)
VALUES (
  'as-70d09d40',
  'u-8e5eb21c',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'PUPS, IKKADU KANDIGAI',
  'Grade 1',
  'A',
  'Mathematics',
  'Subject Teacher',
  true,
  true,
  '{"domain": "edu"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ── READINESS CHECK TEMPLATE ─────────────────────────────────────────────────
-- Shown to every teacher on the Learner > Readiness Check page
INSERT INTO readiness_templates (id, tenant_id, name, description, status, sort_order, targeting, questions, created_at, updated_at)
VALUES (
  'rt-edu-ai-readiness-v1',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'AI Readiness for Teachers',
  'A quick self-assessment to understand your current comfort with AI tools and identify where Shiksha AI can support your teaching journey.',
  'published',
  10,
  '{"schoolName":"Any","grade":"Any","division":"Any","subject":"Any","responsibility":"Any"}'::jsonb,
  '[
    {"id":"q-comfort-ai",    "type":"scale",         "prompt":"How comfortable are you with using AI tools in your daily work right now?",                                                                        "options":["Not comfortable at all","Heard of it but haven''t tried","Tried a couple of times","Use it occasionally","Use it confidently every week"],                 "weight":2},
    {"id":"q-lesson-plan",   "type":"scale",         "prompt":"How often do you currently create detailed lesson plans (with learning objectives, activities, and assessments)?",                                   "options":["Rarely or never","Once a month","Once a week","2–3 times a week","Every teaching day"],                                                                    "weight":1},
    {"id":"q-digital-eval",  "type":"scale",         "prompt":"How comfortable are you with evaluating student work using digital tools or structured rubrics?",                                                   "options":["Not at all","Trying it out","Somewhat comfortable","Comfortable","Very confident"],                                                                        "weight":1},
    {"id":"q-ncert",         "type":"scale",         "prompt":"How well do you know the learning objectives and competencies in your subject''s NCERT / State Board curriculum?",                                  "options":["Still learning","Know the basics","Fairly familiar","Know it well","Expert — I''ve designed units around it"],                                            "weight":1},
    {"id":"q-prior-edtech",  "type":"single_choice", "prompt":"Have you used any AI-powered EdTech platform before (e.g. for lesson creation, question generation, or student analytics)?",                       "options":["Yes, regularly","Yes, tried once or twice","Heard of tools but haven''t used","No, this is my first time"],                                               "weight":1},
    {"id":"q-use-case",      "type":"single_choice", "prompt":"Which AI use case would help you the most right now as a teacher?",                                                                                 "options":["Creating lesson plans and resources faster","Generating question papers and worksheets","Evaluating and giving feedback on student work","Identifying struggling students early"], "weight":1},
    {"id":"q-pd-hours",      "type":"single_choice", "prompt":"On average, how many hours per week can you dedicate to professional development and learning new tools?",                                          "options":["Less than 1 hour","1–2 hours","3–4 hours","5 hours or more"],                                                                                            "weight":1},
    {"id":"q-blocker",       "type":"single_choice", "prompt":"What is the biggest barrier that stops you from using technology more in your teaching?",                                                           "options":["Not sure how to start","Lack of time to learn new tools","Concerned about accuracy or quality","No barrier — I''m ready to go"],                        "weight":2}
  ]'::jsonb,
  extract(epoch from now()) * 1000,
  extract(epoch from now()) * 1000
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Summary of demo accounts  (all passwords: Shiftora@123)
-- =============================================================================
-- ROLE          EMAIL                           NOTES
-- Platform      admin@shiftora.edu.in           /platform/tenants
-- School Admin  demoadmin@dps.com               /admin/overview
-- School Admin  schooladmin@shiftora.edu.in     /admin/overview
-- Principal     principal@shiftora.edu.in       /principal/dashboard
-- HOD           hod@shiftora.edu.in             /hod/dashboard
-- Teacher       demoteacher@dps.com             /learner/dashboard  ← has Grade1 assignment
-- Teacher       teacher@shiftora.edu.in         /learner/dashboard
-- DEO           deo@shiftora.edu.in             /deo/overview
-- BEO           beo@shiftora.edu.in             /beo/overview
-- =============================================================================
