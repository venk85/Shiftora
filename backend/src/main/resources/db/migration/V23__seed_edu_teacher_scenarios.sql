-- Seed three teacher-focused AI sandbox scenarios for the edu industry.

INSERT INTO scenarios (id, industry, title, description, icon, sort_order, config)
VALUES (
  'edu-lesson-resource-gen',
  'edu',
  'AI Lesson & Resource Generator',
  'Generate complete CBSE/ICSE-aligned lesson plans, HOTS worksheets, PPT slides, and auto-graded exit tickets for any Class 1–10 topic in under 60 seconds.',
  '📚',
  10,
  $sc1${
    "inputs": [
      {"key": "topic",       "label": "Topic",            "type": "text",     "placeholder": "e.g. Photosynthesis"},
      {"key": "grade",       "label": "Class",            "type": "text",     "placeholder": "e.g. Class 6"},
      {"key": "subject",     "label": "Subject",          "type": "text",     "placeholder": "e.g. Science"},
      {"key": "board",       "label": "Board",            "type": "select",   "options": ["CBSE","ICSE","IB","State Board"]},
      {"key": "duration",    "label": "Class Duration",   "type": "select",   "options": ["30 minutes","45 minutes","60 minutes"]},
      {"key": "deliverable", "label": "What to Generate", "type": "select",   "options": ["Lesson Plan","HOTS Worksheet","PPT Outline","Exit Ticket","All of the above"]},
      {"key": "language",    "label": "Language",         "type": "select",   "options": ["English","Hindi","Tamil","Telugu","Kannada"]}
    ],
    "systemPrompt": "You are an expert curriculum designer and master teacher with 20 years of experience in Indian K-12 education across CBSE, ICSE, and IB boards. You produce classroom-ready materials — lesson plans, HOTS worksheets, PPT outlines, and exit tickets — that are pedagogically sound, NCERT-aligned, and immediately usable by teachers. Always structure output with clear headings, timing breakdowns, Bloom's taxonomy levels for each activity, and a self-assessment rubric. For worksheets, include at least 3 HOTS questions (analysis, evaluation, creation levels). For PPT outlines, include slide titles, key talking points, and suggested visuals. For exit tickets, include 2 MCQs and 1 short-answer question. Use simple, classroom-friendly English unless another language is specified.",
    "scoreLabels": ["Curriculum alignment","HOTS depth","Classroom readiness"],
    "tags": ["NCERT Aligned","HOTS Questions","Instant PPT","Exit Tickets"]
  }$sc1$::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scenarios (id, industry, title, description, icon, sort_order, config)
VALUES (
  'edu-paper-evaluation',
  'edu',
  'AI-Powered Paper Evaluation',
  'Upload Class 1–10 answer scripts and receive instant marks, topic-level feedback, and parent-ready report cards for every student.',
  '📝',
  20,
  $sc2${
    "inputs": [
      {"key": "subject",      "label": "Subject",         "type": "text",   "placeholder": "e.g. Science"},
      {"key": "grade",        "label": "Class",           "type": "text",   "placeholder": "e.g. Class 8"},
      {"key": "board",        "label": "Board",           "type": "select", "options": ["CBSE","ICSE","IB","State Board"]},
      {"key": "maxMarks",     "label": "Maximum Marks",   "type": "number", "placeholder": "e.g. 20"},
      {"key": "questionPaper","label": "Question Paper",  "type": "file",   "accept": ".txt,.pdf", "placeholder": "Upload question paper (TXT or PDF)"},
      {"key": "answerKey",    "label": "Answer Key / Marking Scheme", "type": "file", "accept": ".txt,.pdf", "placeholder": "Upload answer key (TXT or PDF)"},
      {"key": "answerSheet",  "label": "Student Answer Sheet", "type": "file", "accept": "image/*,.pdf", "placeholder": "Upload handwritten or scanned answer sheet (image or PDF)"}
    ],
    "systemPrompt": "You are an experienced CBSE/ICSE examiner and subject teacher. A question paper, answer key, and student answer sheet have been provided. Read the student's handwritten or typed answers carefully, then evaluate them against the answer key and marking scheme. Structure your output exactly as follows:\n\n**Marks Awarded**: X / [total marks]\n\n**What was good**: (specific points the student answered correctly or well)\n\n**Gaps identified**: (specific concepts or points that were missed or incorrect — be precise, never say 'needs improvement' without naming the concept)\n\n**Improvement tips**: (3–5 actionable steps the student can take)\n\n**Parent report card comment**: (2–3 encouraging sentences suitable for sharing with parents)\n\nBe fair, specific, and encouraging.",
    "scoreLabels": ["Marking accuracy","Feedback specificity","Parent communication quality"],
    "tags": ["Handwriting OCR","Auto-Scoring","Topic Feedback","Parent Reports"]
  }$sc2$::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scenarios (id, industry, title, description, icon, sort_order, config)
VALUES (
  'edu-learning-path',
  'edu',
  'Personalised Student Learning Paths',
  'AI analyses each student''s strengths, weaknesses, and pace to create individual Class 1–10 study plans and AI tutor sessions.',
  '🗺️',
  30,
  $sc3${
    "inputs": [
      {"key": "grade",          "label": "Class",                         "type": "text",     "placeholder": "e.g. Class 9"},
      {"key": "subject",        "label": "Subject",                       "type": "text",     "placeholder": "e.g. Mathematics"},
      {"key": "board",          "label": "Board",                         "type": "select",   "options": ["CBSE","ICSE","IB","State Board"]},
      {"key": "studentProfile", "label": "Student Profile",               "type": "textarea", "placeholder": "Describe the student's strengths, weaknesses, recent test scores, and learning style"},
      {"key": "learningGoal",   "label": "Learning Goal",                 "type": "text",     "placeholder": "e.g. Score above 80% in the term exam, master algebra basics"},
      {"key": "weeklyHours",    "label": "Available Study Hours per Week","type": "number",   "placeholder": "e.g. 5"},
      {"key": "duration",       "label": "Plan Duration",                 "type": "select",   "options": ["2 weeks","4 weeks","8 weeks","12 weeks"]}
    ],
    "systemPrompt": "You are a personalised learning coach and AI tutor specialist with expertise in Indian K-12 curriculum across CBSE, ICSE, and IB boards. Based on the student's profile, goal, available time, and subject, produce a structured learning plan with the following sections:\n\n**Priority Learning Gaps**: List the 3–5 most critical concepts the student needs to address first, with a brief reason for each.\n\n**Week-by-Week Study Plan**: Break the plan into weekly goals, naming specific NCERT chapters, exercise numbers, or reference materials for each week. Adapt the pace to the available study hours per week.\n\n**Daily Practice Routine**: Suggest a simple daily routine (e.g. 20 min concept, 20 min practice, 10 min review).\n\n**Milestones & Check-in Questions**: 2–3 milestone questions per phase the student can self-test on.\n\n**AI Tutor Session Script**: A brief script (5–8 exchanges) the teacher can use verbally or share digitally to guide the student through the hardest gap topic.\n\nBe specific and practical — name actual NCERT chapters, exercise numbers, and chapters where helpful.",
    "scoreLabels": ["Gap identification accuracy","Plan practicality","Milestone clarity"],
    "tags": ["Learning Gaps","Study Plans","Pace Tracking","AI Tutor"]
  }$sc3$::jsonb
) ON CONFLICT (id) DO NOTHING;
