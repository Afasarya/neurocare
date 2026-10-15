# NeuroCare - Project Context (Software Engineering)

> Status: Product specification for hackathon prototype, version 1.0, 15 October 2026.
> Audience: Software Engineer and AI coding agents working in the Next.js repository.
> This document is the product and technical source of truth. Read `AGENTS.md` and the relevant `tasks/Fxx-*.md` before changing code.
> Language: Indonesian for product UI and documentation; English for code identifiers and API fields.

## 1. Product identity

- **Name:** NeuroCare
- **Format:** Mobile-first Progressive Web App (PWA), usable on desktop.
- **Problem:** Health-risk monitoring is often fragmented, people may not know what checkups are missing, and people recovering from stroke need a simple way to log non-diagnostic rehabilitation activity and trends.
- **Primary user context:** Indonesian users of productive age. Support accessible interaction for users with physical limitations and their assisting caregivers.
- **Product promise:** Help users record relevant information, understand follow-up gaps, see historical trends, and track rehabilitation activity. It is an **educational/monitoring prototype, not a diagnostic or clinically validated medical device**.
- **Two user pathways:**
  - `NeuroPrevent`: people without a previous stroke/TIA/CVD history, oriented to risk-factor screening, monitoring and prevention.
  - `NeuroRecovery`: people after stroke, oriented to self-report, activity logs, progress and follow-up. Prior stroke/TIA/CVD must not be fed into a WHO *primary-prevention* risk chart.
- **Cross-pathway foundation (Point C):** Health Timeline & Preventive Action Planner.

## 2. Agreement on Point A, B, C and priorities

Priorities: `P0` = must work in MVP; `P1` = stretch for hackathon demo after P0; `P2` = documented backlog, do not implement by default.

| Point | ID | Feature | Priority | Software Engineer responsibility |
| --- | --- | --- | --- | --- |
| **A: NeuroPrevent** | F01 | Smart Stroke Risk Screening | P0 | Screen, validation, emergency gate, typed API integration, results, history |
| A | F02 | Screening Gap Intelligence | P0 | Display missing checks and action suggestions from deterministic engine |
| A | F03 | Camera-Based PPG Monitoring | P1 | Camera permission/capture UI, client signal sampling, API integration, BPM session UX |
| A | F04 | AI Personalized Health Insight | P0 | Safe insight display, structured API integration, consent, fallback |
| **B: NeuroRecovery** | F05 | Recovery Assessment & Check-in | P0 | Accessible check-in and saved self-reported functional observations |
| B | F06 | AI Motion Rehabilitation Tracker | P1 | Camera UX, MediaPipe integration boundary, session view and storage |
| B | F07 | AI Recovery Progress Monitoring | P0 | Progress visuals, activity/check-in trends, AI explanation integration |
| **C: Shared foundation** | F08 | Health Timeline & Preventive Action Planner | P0 | Shared timeline, measurements, tasks, follow-ups, RLS data layer |
| Backlog | F09 | Speech & Communication Rehabilitation | P2 | Future feature shell/specification only |
| Backlog | F10 | Cognitive Rehabilitation Mini-Games | P2 | Future feature shell/specification only |
| Backlog | F11 | Caregiver Dashboard & Reminders | P2 | Future feature shell/specification only |

**MVP delivery set:** F01, F02, F04, F05, F07, F08. **Stretch set:** F03, F06. **Deferred:** F09-F11.

### Dependencies and sequencing

1. Foundation: Supabase connection, auth/session, profiles, private routes, base layout, RLS, error handling.
2. F08 data foundation and shared timeline/measurement persistence.
3. A: F01 screening workflow; F02 gap results; F04 explanation display.
4. B: F05 check-in; F07 progress visualization/explanation.
5. P1: F03 PPG; F06 motion tracking.
6. P2 only with explicit user/team approval after P0/P1 are working.

AI Engine components can be mocked behind typed interfaces **only in development** while waiting for the AI Engineer. A mock must be clearly labeled `DEMO / SIMULATED` and must never manufacture a real patient risk percentage, BPM, or clinical claim.

## 3. Team boundaries and ownership

**Software Engineer (this repository / coding agent scope):** Next.js App Router, UI, accessible design, navigation, auth and authorization, Supabase database schema/migrations/RLS, data persistence, privacy UX, PWA, camera/browser permissions, loading/error states, typed REST contracts, charts, client-side integration of approved AI algorithms, tests, deployment.

**AI Engineer (separate ownership; do not silently implement or alter clinical logic):** validated WHO regional chart lookup; emergency/safety clinical rules; screening-gap rules; PPG digital signal-processing algorithm and quality gates; pose-repetition logic and approved movement configuration; structured LLM insight prompts/schema/guardrails; domain-specific algorithm validation.

**Research/proposal teammate:** clinical source verification, age eligibility/clinical restrictions, claims/evidence, privacy/consent text review, approval of rehabilitation activities.

**Pitch/media teammate:** pitch deck, demo narrative, visuals/video; demo data must be synthetic and clearly labeled.

Software Engineer may implement *UI emergency gate and transport routing of safety statuses* but must not invent medical thresholds, diagnosis, exercise prescriptions, or risk computation.

## 4. User journeys

### 4.1 New NeuroPrevent user

1. Open landing -> read product limitations -> register/login.
2. Provide necessary consent -> onboarding (basic profile, age group, user pathway).
3. Before routine screening, answer emergency-symptom gate. Suspected sudden stroke-like symptoms -> urgent help screen, **do not continue routine screening or LLM advice**.
4. Fill screening form. Validate required measurements or explicitly mark them unknown; never guess missing values.
5. If eligible (40-59, no prior stroke/TIA/CVD, enough valid inputs), request AI Engineer's **WHO non-laboratory 10-year combined cardiovascular disease (CVD) risk category**. This is NOT a stroke-specific probability.
6. Ages 18-39 or any ineligible/missing-input scenario receive risk-factor/checkup-gap guidance only, no WHO numerical score.
7. Display F01 result, F02 gaps, optional F04 AI explanation, then action items in F08.
8. Review timeline, update BP/measurements, mark completed follow-ups.

### 4.2 New NeuroRecovery user

1. Login -> select `NeuroRecovery`; show applicable limitations and emergency gate.
2. Complete accessible functional self-report and activity baseline (F05); store source and timestamps.
3. Track repeated check-ins; view trend and adherence (F07); never present app-derived recovery grading or diagnosis.
4. Optional P1: use approved **one seated upper-limb exercise** with consent and camera tracking (F06); stop on sudden new symptoms.
5. Review activities and follow-ups in F08.
6. **Never assign WHO primary-prevention risk percentage to a user with previous stroke/TIA/CVD.**

### 4.3 Failure or no-permission flows

- Denied camera: offer non-camera workflows and clear retry instructions.
- AI service timeout/invalid JSON: safe template fallback; preserve deterministic findings; no invented conclusions.
- Missing BP: show `Belum ada data tekanan darah`, prompt appropriate checking; never impute.
- Network unavailable: PWA shell may load, but sensitive updates need server confirmation; clearly show pending/unavailable instead of pretending data was saved.
- Unauthenticated or wrong user: redirect/login or return 401/403; do not disclose another user's information.

## 5. Mandatory medical and safety boundaries

1. NeuroCare is **not** a stroke diagnosis, emergency triage medical device, clinical decision support replacement, or personalized prescription service.
2. Safety warning / sudden stroke-like symptoms (for example, sudden facial droop, one-sided arm weakness, speech difficulty) -> show immediate direction to local emergency services / nearest emergency facility. Do not delay for login, LLM response or a score. Place visible `Cari bantuan darurat` CTA and do not imply the PWA can assess emergency severity.
3. WHO chart is for **10-year combined CVD events**, not a stroke-specific score. For this product apply it to otherwise eligible NeuroPrevent users aged **40-59** with required valid inputs; the general WHO chart covers ages 40-74. For ages 18-39 show gap-based guidance only.
4. Verify Indonesia uses the **Southeast Asia non-laboratory chart**; regional bands/lookup belong to AI Engineer. Never calculate risk using invented formulas or model-generated figures.
5. Users with prior stroke, TIA or established CVD: exclude from primary-prevention WHO scoring. Their pathway is follow-up / NeuroRecovery.
6. PPG camera estimates **heart rate in BPM only** with signal quality; it does NOT measure blood pressure, detect AF, predict stroke, or contribute to the WHO chart.
7. PPG numbers require valid measured signal and AI Engineer processing; no fabricated `72 BPM` placeholders in real result UI.
8. MediaPipe Pose estimates landmarks and rep counts for **one approved seated arm exercise**; not recovery severity, diagnostic motor score, therapy prescription, or proof of rehabilitation progress.
9. F05 self-report and F07 activity trends are observations, not validated clinical improvement scores. Use standardized Modified Barthel Index only after suitability, licensing/citation if applicable, exact administration and interpretation are approved by research/clinical reviewer.
10. LLM explanations are **secondary** to validated deterministic outputs; never let an LLM compute risk, change emergency gating, order emergency severity, or produce unapproved therapy exercises. Clearly label AI-generated text.
11. No medical claims such as `akurat mendeteksi stroke`, `mendiagnosis`, `pengukuran tekanan darah dari kamera`, or `tervalidasi klinis` in UI/copy/pitch.

## 6. Recommended tech stack and architecture

| Area | Choice | Notes |
| --- | --- | --- |
| Application | Next.js App Router + TypeScript | One full-stack application; **do not add NestJS** |
| CSS / UI | Tailwind CSS, shadcn/ui using **Base UI**, **Nova** preset, Lucide, Geist | Already selected in project initialization; keep visual consistency |
| API/backend | Next.js Route Handlers | Server-side input validation, authorization, AI proxy calls |
| Database/auth | Supabase PostgreSQL + Supabase Auth + `@supabase/supabase-js` + `@supabase/ssr` | Cookie-aware browser/server clients; RLS always |
| Forms | React Hook Form + Zod | Client UX plus separate server-side validation |
| Remote state | TanStack Query | Server requests and cache invalidation |
| Small client state | Zustand | Temporary UI flow state only; no unnecessary PHI persistence |
| Charts | Recharts | Timeline, check-in counts, validated metrics; accessible summaries |
| PWA | Web Manifest + Serwist | Configure with Next.js/Turbopack-compatible official docs; safe caching |
| Camera | Browser `navigator.mediaDevices.getUserMedia()` | HTTPS/localhost, permission and cleanup required |
| Pose | `@mediapipe/tasks-vision` (P1) | Pretrained model; browser integration with AI Engineer's rep-count rules |
| PPG | Browser sampling + AI Engine endpoint (P1) | Optional Python/FastAPI isolated AI processing service |
| Hosting | Vercel | Supabase hosted separately; configure env in deployment |
| Quality | ESLint, TypeScript, unit/component/integration tests | Prefer Vitest + React Testing Library; Playwright when feasible |

```text
Browser (NeuroCare Next.js PWA)
   |-- Next.js UI, React forms, accessible components, camera
   |-- Next.js Route Handlers (auth + validation + orchestration)
          |-- Supabase Auth / PostgreSQL with RLS
          |-- AI Engineer clinical/rules/LLM services
          |-- optional PPG FastAPI processing service
Browser (F06 only): MediaPipe inference + approved rep-count rules
```

**Separation requirement:** External AI API keys stay server-side. Never send raw health data to an LLM without a defined minimum-data policy, consent and team-approved disclosure. Use HTTPS, timeouts and validated structured responses.

## 7. App routes (planned contracts; confirm against repository before implementing)

| Route | Responsibility | Access |
| --- | --- | --- |
| `/` | Landing, goals, limitations and privacy overview | Public |
| `/login`, `/register` | Email/password or agreed Supabase Auth flow | Public |
| `/onboarding` | Consent + pathway/profile | Logged-in |
| `/app/dashboard` | Personalized entry, recent sessions, next actions | Logged-in |
| `/app/screening` | F01 screening flow and safety gate | NeuroPrevent |
| `/app/screening/history` | F01 previous sessions | NeuroPrevent |
| `/app/screening/gaps` | F02 gap cards and follow-up CTA | NeuroPrevent |
| `/app/insights` | F04 safe explanation | Logged-in, source-dependent |
| `/app/pulse-monitor` | F03 camera PPG | P1, consent |
| `/app/recovery` | F05 check-in | NeuroRecovery |
| `/app/recovery/activity` | F06 motion tracker | P1, NeuroRecovery |
| `/app/recovery/progress` | F07 charts and trend summaries | NeuroRecovery |
| `/app/timeline` | F08 integrated event history | Logged-in |
| `/app/action-plan` | F08 next steps/checklist | Logged-in |
| `/app/profile` | Account, privacy, consent and data management | Logged-in |

Route groups such as `src/app/(auth)` or `(dashboard)` do not change public URL segments. Protect private routes **server-side**; hiding frontend navigation alone is insufficient.

### Recommended feature folder structure

```text
src/
  app/
    (auth)/
    (dashboard)/app/
    api/
  features/
    auth/
    screening/
    screening-gaps/
    insights/
    ppg/
    recovery-checkin/
    rehab-motion/
    recovery-progress/
    timeline/
    action-plan/
  components/
    ui/             # shadcn/ui generated components
    layout/          # navigation, headings, empty states
    shared/          # accessible input, warning, chart-summary
  lib/
    supabase/        # client.ts, server.ts, session/proxy helpers
    api/             # typed request/response adapters
    validation/      # zod forms, server request schemas
    safety/          # emergency navigation guards; NOT diagnostic engine
  hooks/
  stores/
  types/
```

Do not create every folder prematurely; add folders when implementing the corresponding task. Avoid duplicate components and feature-to-feature circular imports.

## 8. Integration contracts with AI Engineer

Treat the below as **proposed API contracts**. Agree final JSON types, error codes, versioning, eligibility and timeout with the AI Engineer; do not assume an endpoint is deployed until tested.

| Method / Path | Owner of API route | AI Engineer-owned logic | Frontend responsibilities |
| --- | --- | --- | --- |
| `POST /api/screening/analyze` | Next.js Software Engineer proxy/adapter | WHO eligibility and lookup; deterministic clinical flags | Validate form, display eligible vs unavailable result, save history |
| `POST /api/ai/health-insight` | Next.js Software Engineer proxy/adapter | Structured LLM explanation and guardrails | Display disclosed AI insight, safe fallback, prompt consent |
| `POST /api/ppg/analyze` | Next.js Software Engineer proxy/adapter | PPG filtering, signal quality, BPM processing | Capture red-channel sample/timestamps, submit consented signal |
| `POST /api/recovery/activity` | Next.js Software Engineer route | Approved rep-count algorithm specification (browser or service) | Persist session metrics, refuse invalid/repeated IDs |
| `POST /api/ai/recovery-insight` | Next.js Software Engineer proxy/adapter | Structured, non-diagnostic progress explanation | Display trend context and fallback |

Minimum contract principles:

- Zod-validate **every** external request and response on trust boundaries.
- Authenticated server routes derive `userId` from validated session, **not** from client-provided `userId`.
- Use `application/json`, ISO 8601 timestamps, stable enum strings, units (`mmHg`, `kg`, `cm`, `bpm`, `seconds`) and typed `null` for missing values.
- Standard success envelope suggestion: `{ data, meta: { version, source, generatedAt } }`.
- Standard error envelope suggestion: `{ error: { code, message, retryable? } }`.
- Supported statuses: `ok`, `insufficient_data`, `not_eligible`, `unavailable`, `emergency` as appropriate. Never convert `unavailable` or `insufficient_data` into an invented result.
- Provide result provenance (`source`, `chartRegion`, `chartVersion`, `engineVersion` as applicable), and record that WHO risk means CVD 10-year estimate, never stroke-only.
- AI responses can time out, contain malformed JSON, or fail. Validate and provide a **non-numeric** locally maintained fallback; preserve validated deterministic data.
- Avoid double-submitting; add `requestId` / idempotency strategy to session-saving endpoints where useful.
- Permission for camera and personal data usage must be contextual and revocable.
- Do not leak tokens, service keys, patient health fields or raw frames in exceptions, request logs or analytics.

### API integration readiness checklist

- [ ] AI Engineer provides request/response fixtures (valid, invalid, emergency, timeout, not eligible).
- [ ] API schemas are agreed and committed in TypeScript/Zod.
- [ ] UI can run against **clearly labeled demo fixtures** without production medical claims.
- [ ] Server verifies Auth, rate limits expensive AI routes as feasible and enforces payload size.
- [ ] Transport timeout, retry behavior, 429 and 5xx messaging are tested.
- [ ] Real endpoint result has provenance; no placeholder fabricated health metric.

## 9. Data model - proposed logical entities (not finalized SQL)

All personally linked tables should have `user_id` FK to `auth.users` or user profile mapping with appropriate delete/retention policy, creation and update timestamps, and per-user RLS.

| Entity | Purpose | Important constraints |
| --- | --- | --- |
| `profiles` | Minimal user profile, route preference, required eligibility metadata | Prevent unauthorized edits to role/pathway/security fields |
| `consents` | Accepted policy version, purpose, recorded timestamp and withdrawal | Separate purposes for health processing, camera and AI transfer where needed |
| `health_measurements` | User-entered BP, height/weight and date; explicit unknowns | Store units, measurement date and source; no implied clinical accuracy |
| `screening_sessions` | Input snapshot reference, eligibility/status, engine provenance, generated result | Do not persist made-up risk percentages; authorized owner only |
| `screening_gaps` | Derived or stored follow-up gaps and evidence | Source and generated time; can be recalculated |
| `ppg_sessions` | BPM measurement only, signal quality and timing | No raw camera video; never claim BP/AF/stroke diagnosis |
| `recovery_checkins` | Self-reported ability, symptoms and limitations | User-reported, non-diagnostic, time-stamped |
| `recovery_activities` | Approved movement, repetitions, duration, session status | Not clinical motor grade; activity ID/version |
| `action_items` | Follow-up action checklist and completion status | Preserve who/when changed and provenance |
| `timeline_events` | Unified view / optional materialized event references | Prefer aggregate query/view over unnecessary duplicated PHI |

**Important:** This is a logical proposal. Before migrations, review final fields, foreign keys, indexing, `NOT NULL`, `CHECK` constraints, deletion/retention and RLS with the team. Never execute migrations against production data without a plan.

## 10. Privacy, security and RLS requirements

- Health information is sensitive: minimize collection and retention. Store only what each MVP feature needs.
- Consent must be explicit, understandable and purpose-specific; users should be able to access their history and learn how to request deletion.
- Supabase `anon`/publishable key can appear client-side when RLS is correct; **secret/service_role keys and DB password never appear client-side**.
- Enable RLS on every user-facing table. Users may read/write only rows owned by their authenticated `auth.uid()`; do not use permissive `USING (true)` policies for personal health rows.
- App route protection: valid cookie-backed Supabase session in Next.js server/proxy; handle expired sessions and unauthenticated API calls.
- Never trust `user_id` supplied in request JSON. Always derive it on the server from auth.
- Validate and sanitize form data server-side; constrain units and reasonable bounds with approved schemas. Do not interpret clinically.
- No PHI in `localStorage`, persisted Zustand stores, PWA caches, analytics, logs or screenshots by default.
- PWA cache only public shell/static assets. Exclude `/api`, auth responses and private health pages/data from cache.
- Camera/microphone only after permission; stop media tracks when leaving page, on cancel and on error. No raw video or audio upload unless approved and indispensable.
- For public demo, use **synthetic** data. Never use a teammate's real health record in presentations.
- Validate API payload sizes; AI endpoints require auth, quota/rate limiting where feasible, and server-side tokens.
- PWA must function securely on HTTPS in deployment; `localhost` allowed during development.

## 11. Accessibility and responsive UI

- Mobile-first minimum 320px width, desktop coherent at 1280px+; touch controls large enough to use reliably.
- Prefer semantic HTML, meaningful labels, high contrast and visible keyboard focus.
- Error messages must be clear, text-based and screen-reader accessible; don't convey health status by color alone.
- Avoid tiny charts as sole information source; provide accessible data summaries/table alternatives.
- Support large text, reduced motion and forgiving tap targets, especially NeuroRecovery exercise controls.
- Always show explicit units and `data tidak tersedia` for missing metrics.
- Use Indonesian product copy and understandable terms; disclose algorithm limitations near relevant results.
- Emergency status must be visually prominent, readable and navigable without animation.

## 12. Global app states and UX invariants

- Every async UI supports `idle`, `loading`, `success`, `empty`, `error` (and `not_eligible`/`emergency` when relevant).
- Never show a success toast before DB/API confirms saving.
- Require explicit camera permission before access. Show retry and cleanup behavior.
- Never display AI placeholder output as a real user-specific clinical assessment.
- Show last-updated timestamp and source on trend data.
- Display disclaimer on screening, pulse estimation and rehabilitation results.
- Differentiate `belum diukur`, `data tidak valid`, and `hasil tidak tersedia`.
- Handle age 18-39 / 40-59 / other age cases explicitly; **do not extend scoring beyond agreed 40-59 MVP scope**.

## 13. Definition of Done (applies to every task)

A feature is DONE only when:

- [ ] Acceptance criteria in its task file are actually verified.
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass (or failures explicitly explained as pre-existing with evidence).
- [ ] Unit/integration tests cover important happy path, failure and authorization behavior.
- [ ] Layout works on mobile and desktop, keyboard navigation and screen-reader labels verified.
- [ ] Sensitive endpoints validate auth and input; RLS checked for same-user versus other-user access.
- [ ] No new secrets, real PHI, mocked medical values presented as real, or noisy logs.
- [ ] Data/status provenance, loading/empty/error/emergency UX considered.
- [ ] Docs/task checklist updated only for work actually completed, including any known limitations.

## 14. Project-wide environment variables (names; NO VALUES)

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Only when agreed with AI Engineer, server-side only:
AI_SERVICE_URL=
# Optional server-side LLM key if backend directly calls a provider:
# OPENAI_API_KEY=
# GEMINI_API_KEY=
```

- `.env.local` exists locally and is in `.gitignore`. Never copy real credentials into Markdown.
- Keep `.env.example` with names and placeholder values only.
- Next.js 16 uses `proxy.ts` for session refresh (older versions use `middleware.ts`); inspect installed version before implementation.
- Serwist configuration must follow documentation compatible with the **installed** Next.js/Turbopack version; do not blindly paste older Webpack config.

## 15. Validation / demo scenarios

1. New user -> login -> select pathway -> consent -> dashboard.
2. NeuroPrevent, age 18-39, BP unknown -> **gap guidance only**, no WHO numerical risk.
3. NeuroPrevent, eligible 40-59 and valid inputs -> AI Engineer-verified WHO **10-year CVD** category with source/limitations.
4. NeuroPrevent with established stroke/TIA/CVD history -> **WHO primary-prevention score blocked**.
5. Sudden new stroke-like symptoms from any path -> urgent help screen, no AI wait.
6. AI outage -> deterministic findings remain, transparent insight unavailable/template fallback.
7. NeuroRecovery -> check-in -> saved activity -> view chart/history; charts are not clinical grades.
8. Second user cannot read or mutate first user's rows (RLS, server auth).
9. Denied camera -> app usable, session never recorded as successful.
10. PWA offline -> public shell may work; private APIs explicitly unavailable, no false save notification.

## 16. Decisions, assumptions and open questions

**Confirmed decisions**
- Next.js full stack, not Next.js+NestJS; Supabase is primary data/auth platform.
- shadcn Base UI + Nova preset + Lucide/Geist, Tailwind.
- F01-F08 form Points A-C, with P0/P1 split; F09-F11 remain P2 backlog.
- AI Engineer owns model/medical algorithms; Software Engineer owns product integration.

**Needs team confirmation before implementing medically consequential output**
- Precise, clinician-reviewed emergency and eligibility questions/copy.
- Exact WHO chart lookup version, mapping, test vectors and eligibility edge cases.
- Structured response schemas for each AI service, including failure statuses and versioning.
- PPG sampling method, device validation expectations and signal-quality rules.
- One approved upper-limb rehab exercise, safety guidance and repetition algorithm.
- Consent wording, data retention, removal request workflow and privacy notice.
- Whether any third-party LLM receives minimal personal health context; consent and transfer safeguards.
- Whether a standardized functional index (e.g. Modified Barthel) is authorized and how to administer it correctly.

**Default while blocked:** Build typed UI shells, local form validation, API adapters, states and **labeled synthetic fixtures**; do not invent medical rules or claim functionality is medically validated.

## 17. Task files (one per feature)

- [F01 - Smart Stroke Risk Screening](tasks/F01-smart-stroke-risk-screening.md)
- [F02 - Screening Gap Intelligence](tasks/F02-screening-gap-intelligence.md)
- [F03 - Camera-Based PPG Monitoring](tasks/F03-camera-ppg-monitoring.md)
- [F04 - AI Personalized Health Insight](tasks/F04-ai-personalized-health-insight.md)
- [F05 - Recovery Assessment & Check-in](tasks/F05-recovery-assessment-checkin.md)
- [F06 - AI Motion Rehabilitation Tracker](tasks/F06-ai-motion-rehabilitation-tracker.md)
- [F07 - AI Recovery Progress Monitoring](tasks/F07-ai-recovery-progress-monitoring.md)
- [F08 - Health Timeline & Preventive Action Planner](tasks/F08-health-timeline-action-planner.md)
- [F09 - Speech & Communication Rehabilitation](tasks/F09-speech-communication-rehab.md)
- [F10 - Cognitive Rehabilitation Mini-Games](tasks/F10-cognitive-rehab-mini-games.md)
- [F11 - Caregiver Dashboard & Reminders](tasks/F11-caregiver-dashboard-reminders.md)

## 18. Authoritative references and internal reading

- WHO non-laboratory CVD chart, Southeast Asia (includes Indonesia): https://www.who.int/docs/default-source/cardiovascular-diseases/southeast-asia.pdf?sfvrsn=cbbee748_2
- SATUSEHAT PTM screening context: https://satusehat.kemkes.go.id/platform/docs/id/interoperability/skrining-ptm/
- Supabase SSR for Next.js: https://supabase.com/docs/guides/auth/server-side
- Supabase SSR client setup: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- MediaPipe Pose Landmarker for Web: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Gemini Structured Output: https://ai.google.dev/gemini-api/docs/structured-output?hl=id
- Serwist Next.js: https://serwist.pages.dev/docs/next/getting-started
- Project-specific operating rules: [AGENTS.md](AGENTS.md)

**For AI agents:** Do not treat an external reference as a substitute for the AI Engineer's reviewed domain implementation and signed-off test vectors.
