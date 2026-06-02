# Shiftora - Full Rebuild Plan (v3)

Pitch-ready multi-industry AI workforce platform. 21 screens, 5 roles, 4 industries. Two demo-critical upgrades over v2:

1. Add tenants (schools/companies) live during the demo, with custom departments.
2. AI Sandbox runs on a real LLM (Claude API via Anthropic Messages API) - not a 1.8 s fake delay.

## 1. Cleanup & foundation

- Delete current `learner.*`, `manager.*`, `admin.*` route files and gamification components.
- Rewrite `src/styles.css` with the Light Professional Theme (Inter, `--bg #F0F3FA`, `--primary #4069F0`, gold/teal/violet/semantic tokens, radii 8/12/16). Light-only.
- Rewrite `src/routes/__root.tsx` to render the Shiftora shell (52 px topbar + 208 px sidebar + main with `<Outlet/>`).

## 2. Global state - `src/lib/shiftora-store.ts` (zustand, persisted to localStorage)

```ts
role: 'platform' | 'admin' | 'principal' | 'hod' | 'learner'
activeTenantId: string
tenants: Tenant[]
overrides: Record<id, Partial<Tenant>>

addTenant, updateTenant, deleteTenant, setActiveTenant, setRole
```

Persisting tenants means new schools/companies added in the demo survive reload.

## 3. Tenant model - `src/lib/shiftora-config.ts`

```ts
type Tenant = {
  id: string;
  name: string;
  abbr: string;
  type: string;
  size: number;
  industry: "edu" | "bfsi" | "gcc" | "health";
  aiName: string;
  subdivisionNoun: string;
  subdivisions: { name: string; hod: string; maturity: number; adoption: number }[];
  roleLabels: [string, string, string, string, string];
  personas: { learner; admin; principal; hod };
  accent: "blue" | "gold" | "teal" | "violet";
  brandColor: string;
};
```

5 seeded tenants (DPS Rohini, Amity, Axis Neo Bank, TCS GCC, Apollo). `useTenant()` hook returns the merged active tenant; every screen reads from it so renames and additions propagate instantly.

## 4. Add tenant on the fly - `/platform/create`

Two-column form:

- Left: org name, industry dropdown, abbr, staff count, plan tier, brand color, AI persona name + instruction.
- Right: subdivision noun, dynamic subdivisions list, role label editor, module toggles, SSO toggles.
- Create tenant CTA -> `addTenant()` -> redirect to `/admin/overview` with the new tenant active.

Same dynamic subdivisions list is reused inside `/admin/config` for editing the active tenant.

## 5. AI Sandbox - real LLM via Claude API

Backend endpoint: `POST /api/sandbox/run`.

- Request body includes `{ aiName, scenarioTitle, systemPrompt, tenantInstruction, scoreLabels, inputs }`, validated with Jakarta Validation.
- `SandboxService` reads `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` from backend environment or root `.env.local`, then calls Anthropic Messages API.
- System prompt is built per scenario plus tenant AI persona instruction.
- Tool-calling returns `{ outputMarkdown: string, scores: { label, value }[] }` so UI output and score bars render deterministically.
- Catches 429 and 402 and returns user-friendly errors.

Frontend route: `/learner/sandbox`.

- Scenario grid with industry-specific scenarios from config.
- Workspace has input form and output panel.
- Generate button shows loading, renders markdown output, and animates score bars.
- "Save to practice log" appends the run to learner practice history.

Secret: configure `ANTHROPIC_API_KEY` for the Spring Boot backend. `ANTHROPIC_MODEL` can override the default Claude model.

## 6. Shell components - `src/components/shiftora/`

- `Topbar.tsx` - logomark, role switcher, tenant switcher, user info.
- `Sidebar.tsx` - org identity card, role-specific nav, AI adoption progress, responsive icon collapse under 900 px.
- `AppShell.tsx`, plus primitives: `MetricCard`, `ProgressBar`, `Chip`, `SectionLabel`, `HeatmapCell`, `ScoreBar`.

## 7. Routes - 21 screens

```text
/platform/tenants     /platform/create
/admin/overview       /admin/maturity      /admin/departments
/admin/people         /admin/content       /admin/config
/principal/dashboard  /principal/heatmap   /principal/roi
/hod/dashboard        /hod/analytics
/learner/assessment   /learner/dashboard   /learner/learning
/learner/workshop     /learner/sandbox     /learner/practice
/learner/check        /learner/certificate
```

`/` -> `/learner/dashboard`. Switching role/tenant redirects to that role's default screen for the active tenant.

## 8. Other interactive flows

- Industry / tenant switcher re-skins role labels, sidebar, AI name, learner persona, subdivision lists, and sandbox scenarios.
- Assessment: 5 sequential question cards, progress bar, results donut, recommended path.
- Heatmap cells click through to `/hod/dashboard`.
- Charts use recharts for trend, weekly sandbox, ROI, maturity, and practice qualification.

## 9. Build order

1. Tokens + Inter + shell + tenant/role switchers wired to store.
2. Tenant model + persisted store + `useTenant()` hook.
3. AI Sandbox end-to-end.
4. `/platform/create` + `/admin/config`.
5. Admin screens.
6. Learner remaining screens.
7. Principal + HOD screens.
8. `/platform/tenants` directory.
9. Polish: animated score bars, hover states, responsive sidebar, empty states.

## Technical notes

- Stack: TanStack Start + React + Tailwind v4 + shadcn. `framer-motion`, `recharts`, `zustand`, `@tabler/icons-react`, `react-markdown`, and `zod`.
- Light theme only.
- Claude API via Spring Boot backend.
- Tenants and edits persist in localStorage.
- No Supabase required.
