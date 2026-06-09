-- =============================================================================
-- Platform-level learning modules (is_platform = true, tenant_id = NULL)
-- Visible to all tenants; school admins adopt them via tenant_module_adoptions.
-- =============================================================================

-- Allow NULL tenant_id for platform (global) modules
ALTER TABLE learning_modules ALTER COLUMN tenant_id DROP NOT NULL;

-- ── MODULE 1: AI Foundations for Teachers ────────────────────────────────────
INSERT INTO learning_modules (id, tenant_id, title, description, level, language, estimated_minutes, status, sort_order, mandatory, is_platform, targeting, created_at, updated_at)
VALUES (
  'pm-ai-foundations', NULL,
  'AI Foundations for Teachers',
  'A beginner-friendly introduction to Generative AI — what it is, how it works, and how teachers can start using it today. Includes videos in English, Tamil, and Hindi.',
  'Beginner', 'English + Tamil + Hindi', 142, 'published', 10, true, true,
  '{"schoolName":"Any","grade":"Any","division":"Any","subject":"Any","responsibility":"Any","board":"Any","minReadiness":0,"maxReadiness":100}'::jsonb,
  extract(epoch from now()) * 1000, extract(epoch from now()) * 1000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO learning_units (id, module_id, title, type, estimated_minutes, sort_order, content) VALUES
  ('pm-af-u1', 'pm-ai-foundations', 'What is Generative AI?', 'reading', 10, 1,
   '{"summary":"Generative AI refers to AI systems that can create new content — text, images, code, audio — based on patterns learned from large datasets. Unlike traditional software that follows fixed rules, generative AI models like ChatGPT and Gemini learn from billions of examples and can generate human-like responses.","body":"Key concepts:\n\n• Large Language Models (LLMs): AI trained on massive text datasets to understand and generate language.\n\n• Prompting: The way you communicate with AI — the quality of your prompt determines the quality of the output.\n\n• AI vs Automation: Traditional automation follows rules you program. AI infers patterns and generates novel responses.\n\n• Use in education: Teachers are using AI to create lesson plans, generate quiz questions, draft parent communications, and personalise student support.\n\nGenerative AI does not replace teachers — it amplifies what a teacher can do by handling time-consuming preparation tasks, freeing more time for actual student interaction."}'::jsonb),
  ('pm-af-u2', 'pm-ai-foundations', 'Introduction to Generative AI (Google Cloud)', 'video', 22, 2,
   '{"summary":"Google Cloud''s official introduction to Generative AI — covers foundations of LLMs, how models are trained, and real-world applications. Widely used as the standard beginner reference.","videoUrl":"https://www.youtube.com/watch?v=G2fqAlgmoPo"}'::jsonb),
  ('pm-af-u3', 'pm-ai-foundations', 'Empowering Teachers with AI (CIET-NCERT)', 'video', 60, 3,
   '{"summary":"Live session by CIET-NCERT (India''s National Council for Educational Research and Training) covering how AI can be integrated into school teaching. Specifically designed for Indian school teachers.","videoUrl":"https://www.youtube.com/watch?v=9jXdYX3bjlY"}'::jsonb),
  ('pm-af-u4', 'pm-ai-foundations', 'AI Foundations in Tamil — Mr JR', 'video', 15, 4,
   '{"summary":"தமிழில் Artificial Intelligence அறிமுகம் — AI என்றால் என்ன, எப்படி வேலை செய்கிறது என்று தெளிவாக விளக்குகிறது. (Introduction to AI in Tamil — explains what AI is and how it works.)","videoUrl":"https://www.youtube.com/watch?v=FHBsjIKD-T4"}'::jsonb),
  ('pm-af-u5', 'pm-ai-foundations', 'Practical AI Learning Path in Tamil', 'video', 10, 5,
   '{"summary":"AI கற்றலுக்கான படிப்படியான வழிகாட்டி — தமிழ் ஆசிரியர்களுக்கு சிறந்த தொடக்கப் புள்ளி. (Step-by-step AI roadmap in Tamil — a great starting point for Tamil-speaking teachers.)","videoUrl":"https://www.youtube.com/watch?v=GU7wJR75S4w"}'::jsonb),
  ('pm-af-u6', 'pm-ai-foundations', 'AI Basics for Beginners — Hindi', 'video', 20, 6,
   '{"summary":"हिंदी में Artificial Intelligence की पूरी जानकारी — शुरुआत करने वालों के लिए। (Complete introduction to AI in Hindi for absolute beginners.)","videoUrl":"https://www.youtube.com/watch?v=SeuS84YeJVc"}'::jsonb),
  ('pm-af-u7', 'pm-ai-foundations', 'Try it: Open Gemini and ask a question', 'activity', 15, 7,
   '{"summary":"Hands-on practice — experience AI firsthand.","activity":"1. Open https://gemini.google.com in your browser (free, no payment needed).\n2. Type this prompt: \"Explain [your subject] to a 10-year-old in simple language. Use one example.\"\n3. Replace [your subject] with what you teach — e.g. Fractions, Photosynthesis, or The Water Cycle.\n4. Read the response. Edit your prompt and try again to see how the output changes.\n5. Note one thing that surprised you about the AI''s response."}'::jsonb),
  ('pm-af-u8', 'pm-ai-foundations', 'Quiz: AI Basics', 'quiz', 5, 8,
   '{"summary":"Check your understanding of AI fundamentals.","question":"Which of the following best describes a Large Language Model (LLM)?","answer":"An AI system trained on large amounts of text data that can understand and generate human-like language responses."}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── MODULE 2: Prompt Engineering ─────────────────────────────────────────────
INSERT INTO learning_modules (id, tenant_id, title, description, level, language, estimated_minutes, status, sort_order, mandatory, is_platform, targeting, created_at, updated_at)
VALUES (
  'pm-prompt-engineering', NULL,
  'Prompt Engineering for Classroom Tasks',
  'Learn how to write effective prompts that get useful, accurate AI outputs for lesson planning, quiz creation, and student feedback. With videos in English and Hindi.',
  'Intermediate', 'English + Hindi', 100, 'published', 20, false, true,
  '{"schoolName":"Any","grade":"Any","division":"Any","subject":"Any","responsibility":"Any","board":"Any","minReadiness":25,"maxReadiness":100}'::jsonb,
  extract(epoch from now()) * 1000, extract(epoch from now()) * 1000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO learning_units (id, module_id, title, type, estimated_minutes, sort_order, content) VALUES
  ('pm-pe-u1', 'pm-prompt-engineering', 'Anatomy of a Good Prompt', 'reading', 10, 1,
   '{"summary":"A good prompt has four components: Role, Context, Task, and Format. Mastering this structure gets dramatically better AI outputs.","body":"The RCTF framework for prompts:\n\n• Role: Tell the AI who it should be. Example: \"You are an experienced Class 5 Mathematics teacher.\"\n\n• Context: Give the AI relevant background. Example: \"My students are 10 years old and have just learned fractions.\"\n\n• Task: Be specific about what you want. Example: \"Create 5 word problems about fractions set in a vegetable market.\"\n\n• Format: Specify the output structure. Example: \"Format as a numbered list. Each problem should be 2 sentences.\""}'::jsonb),
  ('pm-pe-u2', 'pm-prompt-engineering', 'Prompt Engineering Tutorial — freeCodeCamp', 'video', 60, 2,
   '{"summary":"Comprehensive prompt engineering tutorial covering best practices for getting better responses from ChatGPT and other LLMs. Covers chain-of-thought prompting, zero-shot vs few-shot, and advanced techniques.","videoUrl":"https://www.youtube.com/watch?v=_ZvnD73m40o"}'::jsonb),
  ('pm-pe-u3', 'pm-prompt-engineering', 'What is Generative AI — Hindi Guide', 'video', 10, 3,
   '{"summary":"Generative AI की शुरुआती जानकारी हिंदी में — प्रॉम्प्ट लिखने से पहले AI को समझना जरूरी है। (Foundational understanding of GenAI in Hindi — essential before writing prompts.)","videoUrl":"https://www.youtube.com/watch?v=AeylSjtjGnc"}'::jsonb),
  ('pm-pe-u4', 'pm-prompt-engineering', 'Write 3 classroom prompts', 'activity', 20, 4,
   '{"summary":"Practise the RCTF framework with three real classroom tasks.","activity":"Write one prompt for each of the following tasks using the Role-Context-Task-Format structure:\n\n1. Lesson plan: Ask AI to create a 45-minute lesson plan for your subject and grade.\n2. Quiz questions: Ask AI to generate 10 multiple-choice questions with answers for your next chapter.\n3. Parent communication: Ask AI to draft a brief progress update for a parent about a student who is struggling.\n\nTry each prompt in Gemini or ChatGPT. Edit and refine until the output is classroom-ready."}'::jsonb),
  ('pm-pe-u5', 'pm-prompt-engineering', 'Quiz: Prompt Quality Check', 'quiz', 5, 5,
   '{"summary":"Test your prompt writing skills.","question":"Which prompt is more likely to produce a useful lesson plan from an AI?","answer":"The specific prompt: \"You are a Class 8 Science teacher. Create a 45-minute lesson plan on Photosynthesis for CBSE students. Include a 10-minute activity and 3 learning objectives.\" — because it uses Role, Context, Task, and Format."}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── MODULE 3: AI Tools for the Classroom ─────────────────────────────────────
INSERT INTO learning_modules (id, tenant_id, title, description, level, language, estimated_minutes, status, sort_order, mandatory, is_platform, targeting, created_at, updated_at)
VALUES (
  'pm-ai-tools', NULL,
  'AI Tools for the Classroom',
  'Explore the best free AI tools for teachers — ChatGPT, Gemini, MagicSchool AI, and your school''s own Shiksha AI. Videos in English and Hindi.',
  'Intermediate', 'English + Hindi', 117, 'published', 30, false, true,
  '{"schoolName":"Any","grade":"Any","division":"Any","subject":"Any","responsibility":"Any","board":"Any","minReadiness":25,"maxReadiness":100}'::jsonb,
  extract(epoch from now()) * 1000, extract(epoch from now()) * 1000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO learning_units (id, module_id, title, type, estimated_minutes, sort_order, content) VALUES
  ('pm-at-u1', 'pm-ai-tools', '6 AI Tools for Teachers — 2025', 'video', 15, 1,
   '{"summary":"A practical overview of the top 6 AI tools teachers are using in 2025, with free-tier options for each tool.","videoUrl":"https://www.youtube.com/watch?v=YnxUwKzfLIk"}'::jsonb),
  ('pm-at-u2', 'pm-ai-tools', 'AI in Education: Must-Have Tools', 'video', 12, 2,
   '{"summary":"Reviews the three most impactful AI tools for teachers: ChatGPT for content generation, MagicSchool AI for classroom-specific tasks, and Curipod for interactive lessons.","videoUrl":"https://www.youtube.com/watch?v=Yg3hIZQm-wM"}'::jsonb),
  ('pm-at-u3', 'pm-ai-tools', 'Best AI Tools for Teachers — Hindi', 'video', 15, 3,
   '{"summary":"स्कूल शिक्षकों के लिए सबसे उपयोगी AI टूल्स हिंदी में। (Most useful AI tools for school teachers explained in Hindi.)","videoUrl":"https://www.youtube.com/watch?v=nD5LEOJtO_o"}'::jsonb),
  ('pm-at-u4', 'pm-ai-tools', 'ChatGPT and Gemini — Complete Hindi Tutorial', 'video', 60, 4,
   '{"summary":"ChatGPT और Gemini को हिंदी में पूरी तरह से सीखें — शुरुआत से एडवांस तक। (Learn ChatGPT and Gemini completely in Hindi from beginner to advanced.)","videoUrl":"https://www.youtube.com/watch?v=aj9VCDrffmM"}'::jsonb),
  ('pm-at-u5', 'pm-ai-tools', 'Using Shiksha AI for Lesson Planning', 'reading', 10, 5,
   '{"summary":"How to use your school''s built-in Shiksha AI sandbox to generate curriculum-aligned content.","body":"Shiksha AI is available in your school portal under Learner → AI Sandbox.\n\nKey scenarios available:\n\n• AI Lesson & Resource Generator: Enter your topic, grade, subject, and board. Shiksha AI generates a complete lesson plan with objectives, activities, and HOTS questions — aligned to your curriculum.\n\n• AI Paper Evaluation: Upload a student''s answer sheet and marking scheme. Get automated marks, topic-level feedback, and a parent-ready comment.\n\n• Personalised Learning Path: Describe a student''s current level and learning goal. Get a week-by-week study plan with specific chapter references.\n\nAll outputs are saved to your Practice log automatically."}'::jsonb),
  ('pm-at-u6', 'pm-ai-tools', 'Run a Sandbox scenario and save it', 'activity', 10, 6,
   '{"summary":"Hands-on practice with Shiksha AI.","activity":"1. Go to Learner → AI Sandbox in the menu.\n2. Click the ''AI Lesson & Resource Generator'' card.\n3. Fill in: Topic = any topic from your next class, Grade = your grade, Subject = your subject, Board = your board, Duration = 45 min.\n4. Click ''Generate with AI'' and read the output.\n5. Click ''Save to Practice'' — this saves it to your practice log."}'::jsonb),
  ('pm-at-u7', 'pm-ai-tools', 'Quiz: AI Tool Selection', 'quiz', 5, 7,
   '{"summary":"Test your understanding of which AI tools fit which teaching tasks.","question":"Which AI tool is best for generating a CBSE-aligned worksheet with HOTS questions for Class 8 Science?","answer":"Shiksha AI''s Lesson & Resource Generator (or ChatGPT/Gemini with a specific prompt) — because they can be directed to generate curriculum-aligned content with specific question types like HOTS."}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── MODULE 4: AI for Tamil Nadu State Board Teachers ─────────────────────────
INSERT INTO learning_modules (id, tenant_id, title, description, level, language, estimated_minutes, status, sort_order, mandatory, is_platform, targeting, created_at, updated_at)
VALUES (
  'pm-tn-state-board', NULL,
  'AI for Tamil Nadu State Board Teachers',
  'Specifically designed for TN State Board school teachers — aligning AI tools with NCERT and TN SCERT curriculum. Includes Tamil and Hindi videos plus DIKSHA resources.',
  'Intermediate', 'Tamil + Hindi + English', 127, 'published', 40, false, true,
  '{"schoolName":"Any","grade":"Any","division":"Any","subject":"Any","responsibility":"Any","board":"Tamil Nadu State Board","minReadiness":0,"maxReadiness":100}'::jsonb,
  extract(epoch from now()) * 1000, extract(epoch from now()) * 1000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO learning_units (id, module_id, title, type, estimated_minutes, sort_order, content) VALUES
  ('pm-tn-u1', 'pm-tn-state-board', 'NCERT + TN State Board Curriculum with AI', 'reading', 15, 1,
   '{"summary":"How to align AI-generated content with the Tamil Nadu State Board and NCERT curriculum.","body":"Tamil Nadu schools follow the Tamil Nadu State Board curriculum, which closely parallels NCERT for most subjects at primary and middle school levels.\n\nWhen using AI for lesson planning:\n\n• Always specify the board in your prompt: ''Tamil Nadu State Board'' or ''TN SCERT''\n• Specify the medium of instruction: Tamil medium or English medium\n• Reference specific term books: Term 1, Term 2, Term 3 for TN Board\n• Mention the lesson/chapter name from the textbook\n\nFor DIKSHA resources: The Tamil Nadu SCERT has curated digital resources for every TN Board textbook chapter on DIKSHA (diksha.gov.in/tn). These are free and can be referenced alongside AI-generated content."}'::jsonb),
  ('pm-tn-u2', 'pm-tn-state-board', 'AI in Tamil — Beginners (Tamil)', 'video', 12, 2,
   '{"summary":"செயற்கை நுண்ணறிவு என்றால் என்ன என்று தமிழில் எளிமையாக விளக்கும் வீடியோ. (A simple Tamil-language video explaining what Artificial Intelligence is.)","videoUrl":"https://www.youtube.com/watch?v=VyPRzfMTids"}'::jsonb),
  ('pm-tn-u3', 'pm-tn-state-board', 'AI Tutorial in Tamil — Mr JR', 'video', 15, 3,
   '{"summary":"AI பற்றிய விரிவான தமிழ் பயிற்சி — ஆசிரியர்களுக்கு ஏற்ற எடுத்துக்காட்டுகளுடன். (Comprehensive AI tutorial in Tamil with teacher-friendly examples.)","videoUrl":"https://www.youtube.com/watch?v=FHBsjIKD-T4"}'::jsonb),
  ('pm-tn-u4', 'pm-tn-state-board', 'CIET-NCERT AI Teacher Training Phase II (Hindi)', 'video', 60, 4,
   '{"summary":"CIET-NCERT द्वारा शिक्षकों के लिए AI प्रशिक्षण कार्यक्रम — Phase II। राष्ट्रीय शिक्षा परिषद द्वारा भारतीय विद्यालय शिक्षकों के लिए विशेष रूप से तैयार। (NCERT AI training for teachers, Phase II — designed specifically for Indian school teachers.)","videoUrl":"https://www.youtube.com/watch?v=BCu_oxWO7ws"}'::jsonb),
  ('pm-tn-u5', 'pm-tn-state-board', 'What is Generative AI — Hindi Guide', 'video', 10, 5,
   '{"summary":"Generative AI को हिंदी में समझें — TN Board शिक्षकों के लिए जो हिंदी में सीखना पसंद करते हैं। (Understand Generative AI in Hindi — for TN Board teachers who prefer Hindi.)","videoUrl":"https://www.youtube.com/watch?v=AeylSjtjGnc"}'::jsonb),
  ('pm-tn-u6', 'pm-tn-state-board', 'DIKSHA Tamil Nadu Resources', 'external', 5, 6,
   '{"summary":"Access free SCERT-curated digital resources for every TN Board textbook chapter.","externalResources":[{"title":"DIKSHA Tamil Nadu — Browse by Class and Subject","url":"https://diksha.gov.in/tn/","source":"DIKSHA"},{"title":"DIKSHA CIET-NCERT AI Training Courses","url":"https://ciet.ncert.gov.in/activity/aiseries","source":"NCERT"}]}'::jsonb),
  ('pm-tn-u7', 'pm-tn-state-board', 'Practice: DIKSHA enrolment + Shiksha AI', 'activity', 30, 7,
   '{"summary":"Combine DIKSHA free resources with Shiksha AI for your teaching practice.","activity":"Part A — DIKSHA:\n1. Visit https://diksha.gov.in/tn/\n2. Browse your subject and class (e.g., Class 6, Science, Tamil medium)\n3. Find one video or resource relevant to your next lesson\n4. Note the resource title and what it covers\n\nPart B — Shiksha AI:\n1. Open Shiksha AI sandbox → AI Lesson & Resource Generator\n2. Fill in your subject, grade, board = Tamil Nadu State Board, medium = Tamil\n3. Generate a lesson plan for the same topic as your DIKSHA resource\n4. Compare: how does the AI output complement the DIKSHA video?\n5. Save the AI output to your Practice log"}'::jsonb),
  ('pm-tn-u8', 'pm-tn-state-board', 'Quiz: TN Board AI Usage', 'quiz', 5, 8,
   '{"summary":"Test your knowledge of AI tools in the TN State Board context.","question":"When writing an AI prompt to create a lesson plan for a Tamil Nadu State Board Class 4 Tamil medium class, which details are most important to include?","answer":"Board (Tamil Nadu State Board), medium of instruction (Tamil medium), class (Class 4), subject, term and chapter reference from the TN textbook, and the desired output format."}'::jsonb)
ON CONFLICT (id) DO NOTHING;
