# AGENTS.md - NeuroCare Coding Agent Operating Rules

> Purpose: Operational contract for Cursor, Windsurf, Claude Code, Copilot-like agents and other coding assistants in the NeuroCare repository.
> Scope: **Software Engineer work only**. The AI Engineer owns clinical/risk/signal-processing algorithms and LLM domain prompt policy.
> Read `PROJECT_CONTEXT.md` and the one target `tasks/Fxx-*.md` before editing code.

## 0. Mandatory startup routine

1. Inspect `package.json`, installed Next.js version, `src/`, existing routes, `components.json`, `tsconfig.json` and Supabase helpers.
2. Read `PROJECT_CONTEXT.md` for product, user paths, priorities, limitations and security.
3. Read **one target feature task file**, implement only the requested items. Ask before scope changes, algorithm assumptions or DB-breaking changes.
4. Summarize existing files impacted, implementation steps, potential clinical/security dependencies, and test plan **before writing** substantial code.
5. Make incremental changes, reuse existing project style and dependencies, and avoid unnecessary new libraries.
6. At completion, list changed files, commands run/results, unchecked items, deployment/manual steps and blockers. Never claim tests passed unless run.

## 1. Decision hierarchy and conflict handling

- Respect explicit user instructions and applicable safety constraints first.
- For product facts and medical limits, follow `PROJECT_CONTEXT.md`.
- For per-feature acceptance criteria, follow `tasks/Fxx-*.md`.
- For implementation details, follow verified repository code and installed dependency documentation.
- If documents conflict, **report the conflict** and request a decision; do not silently reinterpret patient-risk behavior.
- Work on **one feature task at a time** unless explicitly asked for a cross-feature foundation.
- No auto-start on F09-F11 (P2). No P1 until P0 foundation is stable unless explicitly requested.

## 2. Absolute prohibitions

- **DO NOT** invent stroke risk %, clinical diagnosis, blood pressure readings, atrial fibrillation detection, emergency triage severity, or clinical recovery score.
- **DO NOT** use GPT/Gemini to calculate WHO risk or override hard safety/eligibility decisions.
- **DO NOT** implement the WHO lookup, PPG signal processing thresholds or rehab rep-count algorithm without an approved AI Engineer contract/test cases.
- **DO NOT** silently assign primary-prevention WHO risk to previous stroke/TIA/CVD users or age 18-39.
- **DO NOT** claim PPG can measure BP or predict stroke, or motion tracking can clinically grade rehabilitation.
- **DO NOT** silently manufacture a successful BPM result, activity completion, risk category or patient insight when an API fails.
- **DO NOT** put secret/service role keys, DB password, LLM API keys or private medical information in client bundles, source, logs or tests.
- **DO NOT** disable RLS, add unrestricted select policies on private data, or trust `userId` from the browser.
- **DO NOT** cache private health API responses offline, put PHI in localStorage/sessionStorage/persisted Zustand or upload raw camera video by default.
- **DO NOT** auto-enable camera/microphone or continue recording after component unmount/cancel.
- **DO NOT** add NestJS, Prisma, Firebase, Redux, Docker, new data stores or a new UI library without explicit architectural approval.
- **DO NOT** edit `.env.local`, delete migrations, reset database, alter auth policy or push to remote without an explicit request/approval.
- **DO NOT** mark task checklist items complete without validating them.

## 3. Feature boundaries

| Agent can implement | Must coordinate / hand off |
| --- | --- |
| Next.js pages/routes/layout, accessible forms and error states | Medical screening thresholds and emergency rule definitions |
| Browser camera permission and frame/signal capture plumbing | PPG filtering, quality scoring, peak detection and BPM algorithm |
| MediaPipe model integration/display and safe session UX | Approved movement, clinically appropriate limits, rep counting rule |
| API proxies, Zod input/output contracts, auth and DB storage | WHO chart mapping, risk labels and eligibility clinical rules |
| Explain deterministic results via API and disclosure UX | LLM medical prompt/safety schema, clinician-reviewed advice |
| Charts/history/activities and consent controls | Recovery improvement grading or treatment recommendations |

If a dependency is unavailable, create a typed adapter and `fixture` inside a `__fixtures__` or `mocks/` folder. Clearly render `Data demo (simulasi)` on screen in dev/demo mode. Do not send fake patient values to production tables.

## 4. Required application architecture

```text
Next.js App Router + TypeScript (strict)
  UI: Tailwind CSS, shadcn/ui Base UI + Nova, Lucide, Geist
  Backend: app/api/**/route.ts (Next.js Route Handlers)
  Persistence: Supabase PostgreSQL/Auth, cookie-aware @supabase/ssr
  Forms: React Hook Form + Zod
  Fetch/cache: TanStack Query
  Temporary UI state: Zustand (not persisted with PHI)
  Charts: Recharts
  PWA: Web Manifest + Serwist (compatible with current Next.js)
  AI Engine: typed server adapters to team-maintained service
```

- Prefer `Server Components` for data-fetching/non-interactive UI, `"use client"` only for interactive form/camera/charts.
- Put feature components under `src/features/<feature>/`, shared components under `src/components/`, and API helpers under `src/lib/`.
- Keep `src/components/ui/` generated by shadcn unless a justified customization is necessary.
- Use `@/` imports; avoid deep relative paths and circular feature imports.
- Use meaningful file names (`screening-form.tsx`, `screening.schema.ts`, `screening.service.ts`, etc.).
- Always type API boundaries; `unknown` + Zod parse is preferable to `any`.
- No `// @ts-ignore`, broad ESLint disables, hidden errors or dummy catch blocks.
- Do not introduce a cross-cutting state framework for trivial local component state.
- Add migrations with RLS together; do not ask users to make undocumented manual tables.

## 5. Auth, Supabase, database and API rules

1. Use `@supabase/ssr` browser/server client split and authenticated server Route Handlers. Inspect Next.js version (`proxy.ts` vs `middleware.ts`).
2. Server verifies session (`auth.getUser()` or suitable verified claims), then obtains user id from verified context. Never accept ownership from JSON body.
3. RLS required for every private table. CRUD policies scoped to `auth.uid()` and a clearly specified policy for all association tables.
4. Enforce database constraints for FK ownership, allowed values, timestamps and non-negative numeric measures.
5. Each API route validates input with Zod and rejects bad payloads with a stable 4xx error. Validate external AI response too.
6. Return safe error codes/messages; do not echo raw provider responses, stack traces, prompts or tokens to browser.
7. Prefer no plain text logs of patient data. Instrument request IDs and error categories instead.
8. Include explicit fetch/cache configuration for private endpoints. Prevent public caching of user-specific data.
9. Prefer idempotent writes or unique operation identifiers to avoid duplicate sessions.
10. Use real auth and RLS tests with at least two separate user identities before claiming isolation works.
11. Never expose private user data through server rendering meant for public pages.

## 6. Patient safety and clinical integration rules

- Emergency symptom gate is a **blocking UX safety flow**, present before regular screening and before rehabilitation. Exact questions/messages must be clinically approved; do not invent clinical scoring.
- On `emergency` response: cancel ongoing routine flow and show urgent help instructions immediately. Do not await AI generation.
- Keep distinct states: `not_eligible`, `insufficient_data`, `unavailable`, `emergency`, `ok`. A loading spinner is not a valid final state.
- WHO chart output label: `Estimasi risiko penyakit kardiovaskular (CVD) 10 tahun`; never `persentase risiko stroke`.
- WHO eligibility restricted to eligible `NeuroPrevent` ages 40-59 in MVP; no primary-prevention score for stroke/TIA/CVD history.
- F03: heart-rate BPM only with signal quality. No BP/AF/stroke prediction claims.
- F05/F06/F07: self-report and activity metrics, **not** proven recovery improvement.
- Always display measurement timestamp, provenance, caveats and missing-data messages.
- LLM cannot change deterministic risk category/emergency behavior. AI text is labeled, validated and degradable.

## 7. UI/UX conventions

- Indonesian copy; plain language, no alarmist language or unrealistic medical benefits.
- Base UI + shadcn Nova visual language, Geist font, Lucide icons. No second component library.
- Mobile-first; responsive and keyboard accessible; labels, help text, useful focus rings and ARIA live status messages.
- Loading, empty, error, partial, insufficient, and denied-permission variants for user-facing states.
- Charts require textual values/trend summary and don't rely solely on color.
- Consent states must be explicit; do not dark-pattern permission prompts.
- Keep destructive actions confirmable and appropriately reversible/explicable.
- Display true confirmation only after awaited server writes succeed.

## 8. Coding and quality conventions

- Use TypeScript strict, discriminated unions for response states, Zod for external boundaries.
- Write small cohesive functions and features; avoid massive page components.
- Use React Hook Form + zodResolver for substantial forms.
- TanStack Query for remote data; invalidate caches after mutations. Avoid mixing with redundant global state.
- Date/time is ISO 8601 in API, formatted in local Indonesian UX; store UTC DB timestamps.
- Include units in labels and types; do not assume BP, BMI or BPM from unlabeled numbers.
- Handle abort/cancellation for long-running fetch/camera operations.
- Add `aria-label` for icon buttons; use explicit alt only for informative images.
- Use deterministic nonmedical UI fixtures in tests; never use personal data.

## 9. Minimum test matrix

| Area | Minimum cases |
| --- | --- |
| Forms | Valid, invalid, missing, extreme values, submit pending, double click |
| Authentication | Logged out, expired session, authorized, cross-user 403/RLS deny |
| Risk eligibility | 18-39 no score, 40-59 eligible path, previous stroke/TIA excluded, missing BP |
| Safety | Emergency response interrupts flow and skips insight/motion |
| AI adapters | Valid result, timeout, 500, malformed response, no data, unavailable |
| Camera P1 | Granted, denied, unsupported, canceled, cleanup, poor signal |
| Charts | Empty data, missing points, correct timestamps/units, mobile responsive |
| Persistence | Own data read/update, other user's data denied, no false success |
| PWA | Correct manifest; offline shell safe; private health API not cached |
| Accessibility | Keyboard operation, visible focus, labels, contrast, chart description |

## 10. Standard agent execution protocol

### Before writing code

Respond with:

```text
Target task: Fxx / short goal
Relevant current files: ...
Implementation outline: 1) ... 2) ... 3) ...
Dependencies/risks: ...
Tests/verification planned: ...
```

### During implementation

- Commit-sized changes; verify files before overwriting.
- Do not rewrite broad unrelated modules.
- Preserve working routes, CSS and auth setup.
- Add TODO only when specific: `TODO(F03, AI_ENGINEER): agree PPG schema and test vectors`.
- Distinguish a **placeholder UI** from completed integration in both task checklist and final report.

### Before reporting completion

Run, if commands exist:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm test -- --run
```

If `npm test` is not configured, say that explicitly and recommend/implement tests if within task scope. Do not claim successful execution of commands not run.

### Final agent report format

```text
Completed: ...
Files changed: ...
Verification: <actual commands and actual results>
Security / accessibility checks: ...
AI Engineer dependencies or assumptions: ...
Remaining unchecked tasks: ...
Next recommended task: ...
```

## 11. Definition of Done and checklist discipline

Task is `DONE` only if:

- All relevant acceptance criteria pass and the feature truly persists/displays correct real-source data.
- No unreviewed medical calculations or therapy assumptions were implemented.
- TypeScript, lint, build and available tests pass; test failures are reported.
- Security: auth server-side, RLS, isolation across user identities, no credentials/PHI leaks.
- Accessible responsive UI and fully working empty/loading/error/denied states.
- Endpoint/API schema, DB migrations and any manual setup are documented.
- Relevant checkboxes in task file are checked **only for observed completed work**.

## 12. Suggested prompts from the human Software Engineer

```text
Read AGENTS.md, PROJECT_CONTEXT.md, and tasks/F08-health-timeline-action-planner.md.
Inspect the current repository, then propose a concise plan for F08 foundation only.
Do not modify clinical algorithms. Implement in small steps, validate auth/RLS,
run checks, and update only completed task checkboxes.
```

```text
Read AGENTS.md, PROJECT_CONTEXT.md, and tasks/F01-smart-stroke-risk-screening.md.
Implement UI + typed API adapter for F01. Do not implement WHO medical calculation.
If AI contract is absent, use labeled synthetic fixtures in development only.
Report missing contracts and tested scenarios.
```

## 13. Reference navigation

- Full product spec: [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
- Individual feature plans: [Task index in PROJECT_CONTEXT.md](PROJECT_CONTEXT.md#17-task-files-one-per-feature)
- Current API/auth approach: https://supabase.com/docs/guides/auth/server-side
- Pose browser integration: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js

**Always prioritize accurate, secure, explainable behavior over an impressive but medically ungrounded hackathon demo.**
