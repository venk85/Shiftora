# Shiftora App Context

Use this context when making fixes in this repo.

## Product Shape

Shiftora is the renamed copy of the earlier Skill Navigator app. It is a pitch/demo-ready AI workforce and education platform, not a generic admin dashboard. Preserve the earlier Skill Navigator context while using the current Shiftora naming.

The app supports multiple industries (`edu`, `bfsi`, `gcc`, `health`) and tenant-specific language, role labels, AI persona, subdivisions, scenarios, and dashboards. The education flow is especially important and now includes school/officer workflows beyond the original 5-role plan.

## Core Roles And Routes

Base roles from the earlier plan:

- `platform`
- `admin`
- `principal`
- `hod`
- `learner`

Current education-specific roles also matter:

- `beo`
- `deo`
- `diet`

Important route families:

- `/platform/*`: tenant directory, tenant creation, officers
- `/admin/*`: overview, maturity/readiness/content/people/config/completion/departments
- `/principal/*`: dashboard, heatmap, ROI
- `/hod/*`: dashboard, analytics
- `/learner/*`: assessment, dashboard, learning, workshop, sandbox, practice, check
- `/beo/*`, `/deo/*`, `/diet/*`: education officer and training views

## Frontend Architecture

- Stack: TanStack Start, React, Tailwind v4, shadcn/Radix primitives, Zustand, Recharts, Framer Motion, React Markdown.
- Shell lives in `src/components/shiftora/AppShell.tsx` and shared primitives in `src/components/shiftora/primitives.tsx`.
- Tenant and role state lives in `src/lib/shiftora-store.ts`.
- Tenant types, scenarios, industry vocabulary, and role labels live in `src/lib/shiftora-config.ts` and related lib files.
- API calls live in `src/lib/shiftora-api.ts`.
- The app should stay light, dense, professional, and operational. Avoid marketing-page patterns for core workflows.

## Backend Architecture

- Backend is Spring Boot under `backend/`.
- Database is Postgres with Flyway migrations under `backend/src/main/resources/db/migration`.
- Flexible tenant/scenario/practice configuration is stored as JSONB where appropriate; reportable/searchable fields are normal columns.
- API runs locally on `http://localhost:8081` with frontend calls routed through `shiftoraApi`.
- Tests live under `backend/src/test/java/com/shiftora/api`.

## Demo-Critical Behavior

- Tenants can be created live and edited later; role labels, subdivisions, AI persona, brand color, and education metadata should propagate through the UI.
- AI Sandbox is real backend-backed LLM behavior through `POST /api/sandbox/run`, not a fake delay. It uses `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY`, with `ANTHROPIC_MODEL` override.
- Sandbox output should remain structured: markdown plus score labels/values for deterministic UI rendering.
- Practice log and journey flows should stay tied to tenant, user, and active assignment context.
- Education UDISE flows matter: UDISE decode/assignment, state/district/block hierarchy, BEO/DEO/DIET views, and officer assignment reviews should not be treated as incidental.
- Platform language settings currently support English/Tamil/Hindi patterns; preserve tenant/platform language behavior when fixing UI or store code.

## Fixing Guidelines

- Prefer existing shared primitives, route patterns, `shiftoraApi`, and tenant/store helpers.
- Keep tenant scoping explicit. Avoid adding global data paths that ignore `tenantId`, user email, assignment id, or role.
- Preserve industry-aware vocabulary and tenant-specific labels instead of hard-coding school-only or corporate-only language unless the route is education-specific.
- Do not commit secrets. Use `.env.azure.example` for deploy examples and keep `.env*`, `.dev.vars`, `dist/`, `target/`, `node_modules/`, `.wrangler/`, and `.tanstack/` ignored.
- For backend fixes, run focused Maven tests where possible. For frontend fixes, prefer `npm run lint`, `npm run test`, or targeted inspection depending on risk.

## Historical Product Intent

Earlier Skill Navigator product intent is summarized in this file. Treat that history as context, but prefer the current codebase when it has advanced beyond the original plan.
