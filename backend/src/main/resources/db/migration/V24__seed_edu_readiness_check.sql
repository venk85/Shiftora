-- Seed a published AI readiness check template for the edu industry demo tenant.
-- Targeting "Any" so it matches every teacher assignment regardless of grade, subject, or school.

INSERT INTO readiness_templates (
  id, tenant_id, name, description, status, sort_order, targeting, questions, created_at, updated_at
)
VALUES (
  'rt-edu-ai-readiness-v1',
  'tn-59f2fc50-3292-4364-9be3-96e2aff83c79',
  'AI Readiness for Teachers',
  'A quick self-assessment to understand your current comfort with AI tools and identify where Shiftora can support your teaching journey.',
  'published',
  10,
  '{"schoolName":"Any","grade":"Any","division":"Any","subject":"Any","responsibility":"Any"}'::jsonb,
  $q$[
    {
      "id": "q-comfort-ai",
      "type": "scale",
      "prompt": "How comfortable are you with using AI tools in your daily work right now?",
      "options": ["Not comfortable at all", "Heard of it but haven't tried", "Tried a couple of times", "Use it occasionally", "Use it confidently every week"],
      "weight": 2
    },
    {
      "id": "q-lesson-plan",
      "type": "scale",
      "prompt": "How often do you currently create detailed lesson plans (with learning objectives, activities, and assessments)?",
      "options": ["Rarely or never", "Once a month", "Once a week", "2–3 times a week", "Every teaching day"],
      "weight": 1
    },
    {
      "id": "q-digital-eval",
      "type": "scale",
      "prompt": "How comfortable are you with evaluating student work using digital tools or structured rubrics?",
      "options": ["Not at all", "Trying it out", "Somewhat comfortable", "Comfortable", "Very confident"],
      "weight": 1
    },
    {
      "id": "q-ncert-familiarity",
      "type": "scale",
      "prompt": "How well do you know the learning objectives and competencies in your subject's NCERT / State Board curriculum?",
      "options": ["Still learning", "Know the basics", "Fairly familiar", "Know it well", "Expert — I've designed units around it"],
      "weight": 1
    },
    {
      "id": "q-prior-edtech",
      "type": "single_choice",
      "prompt": "Have you used any AI-powered EdTech platform before (e.g. for lesson creation, question generation, or student analytics)?",
      "options": ["Yes, regularly", "Yes, tried once or twice", "Heard of tools but haven't used", "No, this is my first time"],
      "weight": 1
    },
    {
      "id": "q-use-case",
      "type": "single_choice",
      "prompt": "Which AI use case would help you the most right now as a teacher?",
      "options": ["Creating lesson plans and resources faster", "Generating question papers and worksheets", "Evaluating and giving feedback on student work", "Identifying struggling students early"],
      "weight": 1
    },
    {
      "id": "q-pd-hours",
      "type": "single_choice",
      "prompt": "On average, how many hours per week can you dedicate to professional development and learning new tools?",
      "options": ["Less than 1 hour", "1–2 hours", "3–4 hours", "5 hours or more"],
      "weight": 1
    },
    {
      "id": "q-blocker",
      "type": "single_choice",
      "prompt": "What is the biggest barrier that stops you from using technology more in your teaching?",
      "options": ["Not sure how to start", "Lack of time to learn new tools", "Concerned about accuracy or quality", "No barrier — I'm ready to go"],
      "weight": 2
    }
  ]$q$::jsonb,
  extract(epoch from now()) * 1000,
  extract(epoch from now()) * 1000
)
ON CONFLICT (id) DO NOTHING;
