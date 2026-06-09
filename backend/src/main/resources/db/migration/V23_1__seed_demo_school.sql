-- Seed the demo edu school tenant, users, and assignment.
-- ON CONFLICT DO NOTHING makes this safe on existing databases (Azure, old volume)
-- where the tenant was already created through the UI.

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
  1780490482264,
  $cfg${
    "board": "Tamil Nadu State Board",
    "aiName": "Shiksha AI",
    "brandColor": "#4069F0",
    "udiseCode": "33010100901",
    "aiInstruction": "Respond as a helpful, classroom-ready co-teacher. Keep examples grade-aware and board-aligned.",
    "subdivisionNoun": "Departments",
    "roleLabels": ["Platform", "School Admin", "Principal", "HOD", "Teacher"],
    "location": {
      "city": "THIRUVALLUR",
      "state": "TAMILNADU",
      "country": "India",
      "district": "TIRUVALLUR",
      "addressLine1": "Test",
      "addressLine2": "",
      "pincode": ""
    },
    "personas": {
      "admin":     {"name": "Admin User",    "title": "School Admin",            "avatar": "AU"},
      "learner":   {"name": "Team Member",   "title": "Teacher - Academic",      "avatar": "TM"},
      "principal": {"name": "Leadership",    "title": "Principal",               "avatar": "LD"},
      "hod":       {"name": "TBD",           "title": "HOD - Academic",          "avatar": "T"}
    },
    "subdivisions": [{
      "id": "ZKg8_1cz",
      "name": "Academic",
      "hod": "TBD",
      "staff": 0,
      "adoption": 0,
      "maturity": 0,
      "leadRole": "Academic lead",
      "description": "Default school academic group."
    }],
    "educationAssignment": {
      "status": "ASSIGNED",
      "message": "School details loaded from UDISE master",
      "boardName": "Tamil Nadu State Board",
      "stateCode": "33",
      "stateName": "TAMILNADU",
      "udiseCode": "33010100901",
      "schoolName": "PUPS, IKKADU KANDIGAI",
      "schoolType": "Government",
      "staffCount": 2,
      "districtName": "TIRUVALLUR",
      "udiseDistrictCode": "3301",
      "blockName": "THIRUVALLUR",
      "udiseBlockCode": "330101",
      "blockUnitName": "Block",
      "blockOfficerTitle": "Block-level education authority",
      "blockOfficerOffice": "THIRUVALLUR Block education authority",
      "blockOfficerContact": "",
      "districtOfficerTitle": "District-level education authority",
      "districtOfficerOffice": "TIRUVALLUR District education authority",
      "districtOfficerContact": ""
    }
  }$cfg$::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Demo users — password hash is BCrypt for "Shiftora@2025"
INSERT INTO app_users (id, tenant_id, email, name, role, avatar, profile, password_hash, created_at)
VALUES
  ('u-abfc5369', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'schooladmin@shiftora.edu.in', 'Vivek Singh',        'ADMIN',     'VS', '{}'::jsonb, '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W', 1780490482264),
  ('u-eb10bf69', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'demoadmin@dps.com',           'DemoTeacher',        'ADMIN',     'D',  '{}'::jsonb, '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W', 1780490482264),
  ('u-0ffb7baf', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'beo@shiftora.edu.in',         'Suresh Babu',        'BEO',       'SB', '{}'::jsonb, '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W', 1780490482264),
  ('u-9d802bcf', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'deo@shiftora.edu.in',         'Rajiv Kumar',        'DEO',       'RK', '{}'::jsonb, '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W', 1780490482264),
  ('u-f905304f', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'hod@shiftora.edu.in',         'Sunita Menon',       'HOD',       'SM', '{}'::jsonb, '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W', 1780490482264),
  ('u-2f798b20', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'principal@shiftora.edu.in',   'Dr. R. Sharma',      'PRINCIPAL', 'DR', '{}'::jsonb, '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W', 1780490482264),
  ('u-8e5eb21c', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'demoteacher@dps.com',         'DemoTeacher',        'TEACHER',   'D',  '{}'::jsonb, '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W', 1780490482264),
  ('u-51390bed', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'teacher@shiftora.edu.in',     'Ms. Ananya Krishnan','TEACHER',   'MA', '{}'::jsonb, '$2a$12$cyfttb130Ij640iFyPwYROeUxW2bArRWmwtQvtWXG2oVMp.Gumk3W', 1780490482264)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Demo teacher assignment: Grade 1A Mathematics at PUPS Ikkadu Kandigai
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
  '{"domain":"edu"}'::jsonb
) ON CONFLICT (id) DO NOTHING;
