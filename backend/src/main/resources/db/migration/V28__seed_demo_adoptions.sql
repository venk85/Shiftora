-- Demo tenant adopts all 4 platform modules
-- School admin can adjust targeting/mandatory via Admin → Content after first login.

INSERT INTO tenant_module_adoptions (id, tenant_id, module_id, mandatory, sort_order, targeting, adopted_at)
VALUES
  ('tma-demo-1', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'pm-ai-foundations',     true,  10,
   '{"board":"Any","grade":"Any","subject":"Any","responsibility":"Any","minReadiness":0,"maxReadiness":100}'::jsonb,
   extract(epoch from now()) * 1000),

  ('tma-demo-2', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'pm-prompt-engineering', false, 20,
   '{"board":"Any","grade":"Any","subject":"Any","responsibility":"Any","minReadiness":25,"maxReadiness":100}'::jsonb,
   extract(epoch from now()) * 1000),

  ('tma-demo-3', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'pm-ai-tools',           false, 30,
   '{"board":"Any","grade":"Any","subject":"Any","responsibility":"Any","minReadiness":25,"maxReadiness":100}'::jsonb,
   extract(epoch from now()) * 1000),

  ('tma-demo-4', 'tn-59f2fc50-3292-4364-9be3-96e2aff83c79', 'pm-tn-state-board',     false, 40,
   '{"board":"Tamil Nadu State Board","grade":"Any","subject":"Any","responsibility":"Any","minReadiness":0,"maxReadiness":100}'::jsonb,
   extract(epoch from now()) * 1000)
ON CONFLICT (id) DO NOTHING;
