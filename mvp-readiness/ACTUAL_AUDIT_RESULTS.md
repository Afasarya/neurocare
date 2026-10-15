# NeuroCare Actual Repository Audit Results

**Audit date:** 2026-10-16 (Asia/Jakarta)  
**Audited commit:** `363ea9e`  
**Scope:** documentation, F01-F12 source, routes, authentication, Supabase, database/RLS, APIs, AI adapters, PWA behavior, UX, and automated quality gates.  
**Release verdict:** `NOT_READY` for an end-user MVP and `NOT_READY` for live AI integration.

## 1. Evidence boundary and status policy

This report describes the repository and configured Supabase project observed on the audit date. It does not infer completion from a checked task box or visible screen.

Statuses used:

- `VERIFIED_DONE`: source evidence plus a relevant automated or reproducible runtime check exists.
- `PARTIAL`: a safe UI/contract/foundation exists, but the end-to-end user outcome is incomplete.
- `BLOCKED_EXTERNAL_AI`: Software Engineer boundary exists, but an approved AI/clinical contract or live acceptance evidence is absent.
- `BLOCKED_DECISION`: implementation depends on an unresolved product, privacy, clinical, or retention decision.
- `NOT_STARTED`: the required implementation is absent after repository inspection.
- `UNVERIFIED`: code exists, but the required runtime, device, accessibility, or isolation evidence is absent.

## 2. Executive result

The repository is a well-guarded **fixture prototype**, not yet a real MVP. Its strongest work is contract validation, honest unavailable states, medical-claim restraint, and safe AI/provider adapters. Its main failure is architectural: the P0 journeys have no working account lifecycle, no version-controlled database schema, no RLS policies, and no real create/read/update persistence.

The ten largest release blockers are:

1. No `/login`, `/register`, onboarding, consent, pathway selection, dashboard, profile, or help routes. Runtime checks returned `404` for all of them.
2. `/app/*` pages are publicly reachable because `src/app/app/layout.tsx:9-68` renders navigation/content without a server session guard; `/app/screening`, `/app/recovery`, `/app/timeline`, and `/app/action-plan` returned `200` while logged out.
3. No `proxy.ts` or equivalent Next.js 16 session refresh/protection mechanism exists.
4. No `supabase/` directory or committed SQL migration exists. A read-only REST probe against the configured project returned `PGRST205` for all proposed P0 tables.
5. RLS cannot be reproduced or tested because the application tables are absent; there is no two-account isolation test.
6. F01, F02, F05, F07, and F08 automatically use synthetic fixture headers in development; production paths mostly return `unavailable` rather than save/read real records.
7. F01 screening analysis is never persisted and `/app/screening/history` is a static “storage not enabled” screen (`src/app/app/screening/history/page.tsx:19-23`).
8. F05 “saved” check-ins only live in component memory and disappear on reload (`src/features/recovery/components/recovery-checkin-view.tsx:45-69,170-172`).
9. F08 measurements/action status/timeline only mutate fixture or in-memory state; production APIs explicitly return `schema_not_approved` (`src/app/api/measurements/route.ts:18-26`, `src/app/api/action-items/[id]/route.ts:18-26`, `src/app/api/timeline/route.ts:14-22`).
10. Tests are primarily schema/selector/fixture unit tests. There are no browser E2E tests, auth flows, RLS isolation tests, component interaction tests, accessibility automation, or persistence-after-refresh tests.

## 3. Verification gates actually run

| Gate | Result | Evidence / limitation |
|---|---|---|
| Node / npm | PASS | Node `v24.11.1`, npm `11.6.2`. Project does not currently document a supported engine range. |
| `npm ci` | FAIL (environment) | `EPERM` while unlinking locked `lightningcss.win32-x64-msvc.node`; dependencies were restored with `npm install`. No tracked file changed. |
| `npm run lint` | PASS | Exit 0 after dependency restoration. |
| `npx tsc --noEmit` | PASS | Exit 0. |
| `npm test -- --run` | PASS | 17 files, 118 tests. Coverage is mainly contracts, fixtures, selectors, safety filters, and stream cleanup. |
| `npm run build` | PASS | Next.js 16.4.1 production build; 32 static/dynamic routes generated. |
| Production HTTP smoke | PARTIAL | Public pages and unauthenticated API behavior checked on `next start -p 3100`. Missing first-use routes returned 404; private-looking pages returned 200; protected GET APIs returned 401. |
| Dependency audit | FAIL | `npm audit --omit=dev` reports 7 high vulnerabilities through `shadcn`/registry tooling dependencies. Fix proposal is breaking and was not applied during audit. |
| Mobile/keyboard/screen reader | UNVERIFIED | Semantics and focus utilities exist in source, but no device/browser/assistive-technology evidence is committed. |
| Two-user RLS isolation | NOT_STARTED | No migrations/tables/policies or authenticated E2E harness. |

## 4. Actual F01-F12 status

| Feature | Priority | Actual status | What is verified | What prevents completion | Key evidence |
|---|---:|---|---|---|---|
| F01 Smart screening | P0 | `PARTIAL` + `BLOCKED_EXTERNAL_AI` | Four-step form, Zod validation, emergency short-circuit, eligibility-safe fixture, authenticated production adapter, no fabricated WHO value. | No approved clinical contract, no persisted session/history, no idempotent write, no RLS/isolation, no real end-to-end result. | `src/features/screening/components/screening-flow.tsx:31-164,241-264`; `src/app/api/screening/analyze/route.ts:32-72`; static history at `src/app/app/screening/history/page.tsx:19-23`. |
| F02 Screening gaps | P0 | `PARTIAL` + `BLOCKED_EXTERNAL_AI` | Typed cards, traceable fixture source, empty/error/completed states, authenticated production read boundary. | Reads no F01/F08 data, no approved deterministic rules, add-to-plan CTA disabled, no invalidation from real writes. | `src/features/screening-gaps/components/screening-gaps-view.tsx:44-97,123-137`; production unavailable at `src/app/api/screening/gaps/route.ts:40-68`. |
| F03 Camera PPG | P1 | `PARTIAL` + `BLOCKED_EXTERNAL_AI` | Explicit camera permission, torch capability check, cleanup primitives, strict response contract, no fake BPM. | “Mulai pengukuran” is disabled; no sampling pipeline, analysis roundtrip, persistence, reference-device validation, or phone tests. | `src/features/ppg/components/pulse-monitor.tsx:125-139`; adapter `src/features/ppg/server/ppg-engine.ts:9-44`. |
| F04 Health insight | P0 | `PARTIAL` + `BLOCKED_EXTERNAL_AI` + `BLOCKED_DECISION` | Consent gate, server-only HTTP adapter, timeout/rate/error handling, structured response validation, unsafe numeric response rejection, safe template fallback. | UI source is a hard-coded demo session; no real F01/F02 record, no approved privacy text/schema/provider acceptance, no persistence. | `src/features/insights/components/health-insight-view.tsx:30-39,49-95,167-194`; adapter `src/features/insights/server/insight-engine-core.ts:7-41`. |
| F05 Recovery check-in | P0 | `PARTIAL` + `BLOCKED_DECISION` | Accessible four-step flow, emergency interruption, strict draft contract, baseline/follow-up fixture behavior, history UI. | Question set not approved; production create/list/detail never writes/reads; “saved” rows are component memory only; no RLS. | `src/features/recovery/components/recovery-checkin-view.tsx:40-92,170-176`; `src/app/api/recovery/checkins/route.ts:60-84`. |
| F06 Motion tracker | P1 | `PARTIAL` + `BLOCKED_EXTERNAL_AI` | Camera/model loading boundary, cleanup, emergency stop, fail-closed API contract, no invented rep counter. | No approved exercise/instructions/rep algorithm; no tracking loop producing reps; no successful save; no device/performance validation. | `src/features/rehab-motion/browser/pose-landmarker.ts:14-29`; locked UX described at `src/features/rehab-motion/components/motion-rehabilitation-view.tsx:123-130`. |
| F07 Recovery progress | P0 | `PARTIAL` | Descriptive aggregates, fixture charts/table/text alternatives, empty/sparse/one-point states; a DB reader is coded. | Required tables do not exist; F05/F06 do not persist; optional AI insight remains unavailable; no cross-user/cache E2E. | DB reader `src/features/recovery-progress/server/progress-service.ts:35-81`; fixture fetch in `src/features/recovery-progress/components/recovery-progress-view.tsx:123-130`. |
| F08 Timeline/planner | P0 | `PARTIAL` | Typed measurement/action/timeline contracts, forms, filters, fixture mutations, explicit units/timestamps, no false production success. | No schema/migrations/RLS; production CRUD unavailable; created measurements exist only in component state; no delete/export/retention flow. | `src/features/health-records/components/health-timeline-view.tsx:35-66,88-90`; production APIs cited in blocker 9. |
| F09 Communication rehab | P2 | `PARTIAL` prototype, correctly disabled | Feature flag defaults off; no microphone/audio/transcript; strict minimal simulated contract and tests. | Not reviewed, persisted, or integrated with timeline; must remain backlog. | `src/features/communication-rehab/communication-rehab.flags.ts`; `src/features/communication-rehab/communication-rehab.test.ts`. |
| F10 Cognitive activity | P2 | `PARTIAL` prototype, correctly disabled | Feature flag defaults off; low-stress local interaction; no scores/leaderboard; strict simulated session boundary. | No clinical/accessibility approval, persistence, history, or timeline integration. | `src/features/cognitive-activities/cognitive-activity.flags.ts`; `src/features/cognitive-activities/cognitive-activity.test.ts`. |
| F11 Caregiver/reminders | P2 | `PARTIAL` prototype, correctly disabled | Default-off flag, least-privilege draft, masked recipient, generic reminder copy, no granted access in fixture. | No identity verification, ACL/RLS, caregiver view, audit trail, provider/scheduler, or revocation enforcement. | `src/features/caregiver/caregiver.flags.ts`; `src/features/caregiver/caregiver.test.ts`; production unavailable routes under `src/app/api/caregiver/`. |
| F12 Landing/design system | P0 | `PARTIAL` | Complete public section layout, responsive header/menu, real anchors, metadata, manifest, install-prompt UX, consistent tokens/components. | CTA bypasses registration/onboarding and sends everyone to screening; no Recovery start CTA; no service worker/offline shell; no Lighthouse/browser accessibility evidence; task checklist is stale. | `src/components/marketing/site-header.tsx:43-103`; `src/components/marketing/landing-sections.tsx:29-63`; `src/app/manifest.ts:3-28`; no service-worker/Serwist source found. |

## 5. Route matrix and broken journey evidence

### Runtime route results while logged out

| Route | Expected | Actual | Status |
|---|---|---|---|
| `/` | Public landing | 200 | `VERIFIED_DONE` for reachability |
| `/login` | Login | 404 | `NOT_STARTED` |
| `/register` | Registration | 404 | `NOT_STARTED` |
| `/onboarding` | Consent/path/profile | 404 | `NOT_STARTED` |
| `/app/dashboard` | Authenticated, path-aware home | 404 | `NOT_STARTED` |
| `/app/profile` | Account/privacy/data controls | 404 | `NOT_STARTED` |
| `/app/help` | Persistent help | 404 | `NOT_STARTED` |
| `/app/screening` | Authenticated Prevent flow | 200 without login | `PARTIAL`, missing guard |
| `/app/recovery` | Authenticated Recovery flow | 200 without login | `PARTIAL`, missing guard |
| `/app/timeline` | Authenticated owner data | 200 without login | `PARTIAL`, missing guard |
| `/app/action-plan` | Authenticated owner data | 200 without login | `PARTIAL`, missing guard |
| `/app/caregiver` | Disabled P2 | 404 | `VERIFIED_DONE` for default-off behavior |
| `/app/recovery/communication` | Disabled P2 | 404 | `VERIFIED_DONE` for default-off behavior |
| `/app/recovery/cognitive-activity` | Disabled P2 | 404 | `VERIFIED_DONE` for default-off behavior |

The build also has no `/app` index route. Landing CTA links point directly to `/app/screening` (`src/components/marketing/site-header.tsx:62-67`, `src/components/marketing/landing-sections.tsx:40-43`), so the intended landing -> account -> consent -> path-selection journey cannot occur.

### Navigation problems for a first-time user

- Desktop/mobile app navigation is a flat feature warehouse with 10+ destinations, no dashboard, no pathway filtering, no breadcrumb/current-route detection, and “Skrining” styled active on every page (`src/app/app/layout.tsx:28-64`).
- Both Prevent and Recovery features appear together, so a novice is not guided by their selected pathway.
- Mobile navigation is a horizontally scrolling list of many small labels instead of the intended 3-5 primary destinations.
- No sign-in state, account menu, sign-out control, help link, consent status, or path indicator appears in the app layout.
- F02 renders an explicitly disabled “Tambah ke Rencana” action (`src/features/screening-gaps/components/screening-gaps-view.tsx:136`).
- F03 renders an explicitly disabled “Mulai pengukuran” action (`src/features/ppg/components/pulse-monitor.tsx:130-137`).
- F06 explains that saving and follow-up are unavailable (`src/features/rehab-motion/components/motion-rehabilitation-view.tsx:123-130`).
- Screening draft is only component state: browser back/refresh discards the flow without a warning or server draft.
- Recovery demo success immediately offers Action Planner even though the new check-in is not persisted or integrated, creating a broken conceptual handoff (`src/features/recovery/components/recovery-checkin-view.tsx:170-172`).

## 6. Authentication, Supabase, database, and RLS audit

### What exists

- A cookie-aware server client using the publishable key exists at `src/lib/supabase/server.ts:4-25`.
- API routes commonly call `supabase.auth.getUser()` and do not accept browser `user_id` ownership.
- Health API responses use private/no-store headers (`src/features/health-records/server/health-records-api.ts:4-8`).
- `.env.local` is ignored and not tracked; only environment variable names were inspected.

### What is absent or unverified

- No browser Supabase client, auth UI, callback/confirm route, password reset, sign-out, or session-expiry UX.
- No Next.js 16 `proxy.ts` for cookie refresh and private route protection.
- No committed database migration, generated database type, seed, local Supabase config, or policy SQL.
- Read-only project probe returned `PGRST205` (table missing from schema cache) for `profiles`, `consents`, `health_measurements`, `screening_sessions`, `screening_gaps`, `insight_records`, `recovery_checkins`, `recovery_activities`, `action_items`, `ppg_sessions`, `caregiver_access`, and `reminder_preferences`.
- Because tables are absent, RLS and cross-user isolation are not merely untested; they are not deployable from this repository.
- No retention, deletion, export, or consent version policy is implemented. F08 correctly labels these controls unavailable (`src/features/health-records/components/health-timeline-view.tsx:66`).

## 7. API and AI integration audit

### Positive evidence

- F01, F03, and F04 have server-only HTTP adapters with timeouts, structured validation, no-store requests, and safe unavailable responses.
- AI/provider keys are referenced only in server modules.
- F04 rejects malformed/unsafe provider output and keeps deterministic source facts separate.
- API handlers derive the authenticated user server-side before production health-data operations.

### Gaps blocking AI handoff

- There is no single `NeuroCareAiGateway` or consistent envelope across F01/F03/F04/F07; contracts use different `meta` shapes and mode fields.
- `SCREENING_ENGINE_URL` and `SCREENING_ENGINE_API_KEY` are used at `src/features/screening/server/screening-engine.ts:12,22` but missing from `.env.example`.
- F01 sends the form directly to the engine but never creates a stable persisted screening record for F02/F04.
- F04 uses hard-coded `demoSessionId`, timestamp, factors, and missing BP in its UI request (`src/features/insights/components/health-insight-view.tsx:30-39,167-183`).
- F07 has no `/api/ai/recovery-insight` route or live adapter.
- No API contract tests exercise Next.js route handlers with authentication, payload limits, 401/403, timeout, malformed live response, and persistence together.
- The in-memory F04 rate limiter is per-process and unsuitable as a durable production quota.

## 8. Forms, buttons, and persistence audit

| User action | Actual behavior | Risk |
|---|---|---|
| Landing “Coba Demo” | Opens public screening directly. | Skips account, consent, pathway selection, and dashboard. |
| Complete F01 | Development returns safe fixture; production can call engine after auth but does not save. | No history, F02/F04 record linkage, or continuity. |
| Open F01 history | Static storage-disabled explanation. | Dead-end for a core user story. |
| Add F02 gap to plan | Button intentionally disabled. | Prevent journey cannot reach actionable persistence. |
| Generate F04 insight | Development uses hard-coded fixture source; production requires consent/auth/config. | Not tied to the user's real screening. |
| Complete F05 | Development adds row to React state only; production returns unavailable. | Reload/sign-out loses it; charts cannot use it. |
| Save F08 measurement | Development returns fixture and adds event to React state only; production returns unavailable. | “Saved” demo is non-durable by design. |
| Toggle F08 action | Development mutates query cache/fixture response; production returns unavailable. | No durable completion history. |
| Install PWA | Manifest and browser prompt handler exist. | No service worker/offline shell, so the promised offline behavior is not implemented. |

## 9. UX evaluation for a novice user

### Prevent user

The screening form itself is understandable, uses explicit unknown states, and explains CVD-vs-stroke semantics well. The journey around it fails: there is no account setup, no explanation of why the user was routed to Prevent, no saved result, and no working add-to-plan action. After refresh, continuity is lost.

### Recovery user

The check-in uses large controls and cautious language, but a novice reaches it from the same flat navigation as Prevent. A “saved” development check-in is session-only. Progress then displays a separate fixture dataset rather than the check-in just entered. This breaks user trust even though both screens are honestly labeled demo.

### General usability

- Good: Indonesian copy, visible safety notices, large touch targets in feature forms, explicit units, honest empty/error/unavailable states, and no fabricated medical metrics.
- Poor: no single obvious next action at app level, no path-aware dashboard, no first-use guidance, no account status, too many navigation destinations, no draft protection, and multiple P1/P0/P2 modules shown together on the main app navigation.
- Unverified: 320/360/390px behavior, screen reader announcements, zoom/large text, reduced motion, browser back behavior, and novice usability sessions.

## 10. Findings register

| Finding ID | Severity | Feature | Current behavior | Evidence | Expected behavior | Proposed fix | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| AUD-001 | blocker | Foundation | No account/first-use routes. | Runtime 404 route matrix; no matching files under `src/app`. | Login/register/consent/path/profile before private app. | Implement Supabase auth and guided onboarding vertical slice. | Software Engineer | `NOT_STARTED` |
| AUD-002 | blocker | Security | Private-looking pages are public. | `src/app/app/layout.tsx:9-68`; runtime 200 without session. | Server-side redirect/guard plus session refresh. | Add Next.js 16 proxy/session refresh and layout guard. | Software Engineer | `NOT_STARTED` |
| AUD-003 | blocker | Database | No version-controlled schema. | No `supabase/` or SQL files; remote probe `PGRST205`. | Reproducible migrations for all P0 entities. | Agree minimal fields then commit migrations and generated types. | Software Engineer + product/privacy review | `BLOCKED_DECISION` |
| AUD-004 | blocker | RLS | No deployable policies or isolation tests. | No SQL/policy files; no auth E2E tests. | Owner-only CRUD and two-user denial evidence. | Add policies with migrations and integration test harness. | Software Engineer | `NOT_STARTED` |
| AUD-005 | blocker | F08 | Core measurement/action/timeline APIs return unavailable in production. | `src/app/api/measurements/route.ts:18-26`; `src/app/api/action-items/[id]/route.ts:18-26`; `src/app/api/timeline/route.ts:14-22`. | Real authenticated CRUD with reload persistence. | Implement F08 first on approved schema/RLS. | Software Engineer | `PARTIAL` |
| AUD-006 | blocker | F01 | Result is not persisted or linked downstream. | `src/app/api/screening/analyze/route.ts:66-72`; no DB write. | Idempotent screening session and owner history. | Store minimal input/result/provenance after engine response. | Software Engineer + AI contract | `BLOCKED_EXTERNAL_AI` |
| AUD-007 | high | F05 | Demo check-in lives only in React state. | `src/features/recovery/components/recovery-checkin-view.tsx:45-69,170-172`. | Server-confirmed baseline/follow-up stored under owner. | Approve question set then implement create/list/detail. | Software Engineer + clinical/research review | `BLOCKED_DECISION` |
| AUD-008 | high | F02 | Personalized gaps are not connected and add-to-plan is disabled. | `src/app/api/screening/gaps/route.ts:55-68`; UI line 136. | Gaps derive from real sessions/measurements and create deduped actions. | Integrate approved rule adapter with F01/F08. | Software Engineer + AI Engineer | `BLOCKED_EXTERNAL_AI` |
| AUD-009 | high | F04 | AI request source is hard-coded demo data. | `src/features/insights/components/health-insight-view.tsx:30-39,167-183`. | Load minimized facts from an owner screening record. | Route by stable session ID and persist provenance per policy. | Software Engineer | `PARTIAL` |
| AUD-010 | high | UX | No path-aware dashboard; flat navigation mixes all modules. | `src/app/app/layout.tsx:28-64`; `/app/dashboard` 404. | One contextual CTA and journey-specific navigation. | Implement onboarding profile/path and dashboard state machine. | Software Engineer/UX | `NOT_STARTED` |
| AUD-011 | high | PWA | Manifest exists, service worker/offline policy absent. | `src/app/manifest.ts`; no Serwist/SW source or dependency. | Public shell caching only; private APIs excluded; honest offline UI. | Add compatible PWA worker after reading local Next 16 docs. | Software Engineer | `PARTIAL` |
| AUD-012 | high | Tests | No auth, RLS, route, browser E2E, or persistence tests. | 17 tests under `src/features`, no Playwright/test harness. | Automated P0 vertical-flow and two-user isolation evidence. | Add integration/E2E suites. | Software Engineer | `NOT_STARTED` |
| AUD-013 | medium | F12 | Landing CTAs skip first-use flow and Recovery choice. | `src/components/marketing/site-header.tsx:62-67`; landing hero lines 40-43. | Register/login or public path explanation leading to onboarding. | Repoint after first-use routes exist; add separate path CTAs. | Software Engineer | `PARTIAL` |
| AUD-014 | medium | Navigation | “Skrining” appears active on every app page. | `src/app/app/layout.tsx:32,51`. | Active state matches pathname and pathway. | Move interactive nav to a small client component. | Software Engineer | `NOT_STARTED` |
| AUD-015 | medium | AI contract | Screening engine env names are undocumented. | Engine lines 12,22; absent in `.env.example:1-16`. | Every server-only integration variable documented by name. | Add screening variables and fixture/live mode documentation. | Software Engineer | `NOT_STARTED` |
| AUD-016 | medium | Docs | Root README is create-next-app boilerplate; root AGENTS lacks canonical links. | `README.md:1-35`; `AGENTS.md:1-11`. | Real setup, architecture, env, migrations, safety, and docs entry point. | Complete MVP-001 and MVP-002. | Software Engineer | `NOT_STARTED` |
| AUD-017 | medium | Dependencies | Production audit reports 7 high findings via tooling dependencies. | `npm audit --omit=dev`. | Reviewed dependency classification/remediation. | Move CLI-only tooling to dev dependency if valid; upgrade with regression checks. | Software Engineer | `UNVERIFIED` |
| AUD-018 | medium | F07 | DB reader exists but cannot run against current schema; fixture is disconnected from new F05 entries. | `src/features/recovery-progress/server/progress-service.ts:35-81`; client fixture fetch lines 123-130. | Charts use owner records and update after real check-in. | Finish F05/F08 storage, then integration test query/invalidation. | Software Engineer | `PARTIAL` |
| AUD-019 | low | Task docs | Several task header/checklist statuses conflict with actual source or remain entirely unchecked. | F01/F02 say `TODO`; F12 checklist unchecked despite source. | Evidence-based status kept current. | Update only after corresponding verified implementation stages. | Software Engineer | `IN_PROGRESS` |
| AUD-020 | low | Tooling | Supported Node version and clean-install behavior are undocumented. | `package.json` has no `engines`; `npm ci` lock conflict during audit. | Reproducible supported setup. | Document Node LTS target and rerun clean install when lock is free. | Software Engineer | `NOT_STARTED` |

## 11. Priority implementation order

### Stage A - Phase 0 evidence and documentation

1. `MVP-001`: preserve generated Next.js guidance and link root `AGENTS.md` to canonical NeuroCare docs and this pack.
2. `MVP-002`: replace README boilerplate with actual setup, environment-variable names, architecture, fixture/live semantics, and verification commands.
3. `MVP-003`: keep this route matrix updated as routes change.
4. `MVP-004`: add reproducible route/API smoke and browser E2E gates rather than relying only on ad-hoc commands.

### Stage B - Shared foundation (release blockers)

1. Auth routes, callback, sign-out, server guard, and Next.js 16 session refresh.
2. Consent/pathway/profile schema and guided onboarding.
3. Minimal P0 migrations with RLS and two-account isolation tests.
4. F08 measurement/action/timeline vertical slice with real reload persistence.
5. Shared app layout, path-aware dashboard, help, offline/error patterns.
6. Reviewed emergency copy implemented independently of AI.

### Stage C - P0 vertical journeys

1. Prevent: F01 save/history -> F02 derived gaps -> F04 linked insight -> F08 action.
2. Recovery: F05 baseline/follow-up -> F07 stored trend -> F08 timeline/action.
3. Fixture AI mode remains clearly labeled; live adapters are selected server-side without UI rewrites.

### Stage D - Only after P0 gates

- F03/F06 physical-device and AI algorithm acceptance.
- F09-F11 remain default-off P2 backlog.

## 12. Exit criteria for changing this verdict

Do not change `NOT_READY` until all of the following have evidence:

- Account -> consent -> pathway -> dashboard works on mobile and keyboard.
- F08 real owner-scoped writes persist across reload and sign-in.
- Two authenticated accounts prove SELECT/INSERT/UPDATE/DELETE isolation at DB and API layers.
- Prevent and Recovery P0 fixture-mode journeys complete end-to-end from stored source records.
- AI timeout/malformed response retains deterministic and stored source data without fake output.
- Public/PWA offline behavior does not cache private APIs or health payloads.
- Lint, TypeScript, unit/integration tests, E2E tests, and production build pass from a reproducible install.

## 13. Implementation progress after the audit

### Stage 0 — evidence and documentation (2026-10-16)

Status: `VERIFIED_DONE` for MVP-000 through MVP-004.

- Root agent guidance now points to the canonical product, task, readiness, and audit documents while preserving the generated Next.js 16 warning.
- README now documents real setup, environment names, fixture/live behavior, architecture, verification commands, security boundaries, and known deployment blockers.
- `.env.example` now includes the previously undocumented server-only screening adapter variables.
- Evidence: this audit, `AGENTS.md`, `README.md`, `.env.example`, and checked items in `04_MVP_IMPLEMENTATION_BACKLOG.md`.
- Verification: `git diff --check`; the audit quality commands recorded in section 2; reproducible Playwright production-server smoke configured in `playwright.config.ts` and `tests/e2e/public-auth.spec.ts`.

### Stage 1A — authentication/session foundation (2026-10-16)

Status: `IN_PROGRESS`; MVP-010 is deliberately not checked yet.

Implemented:

- `/login`, `/register`, `/auth/callback`, authenticated `/app/dashboard`, and `/app` redirect.
- Zod validation in both browser form and route handler, safe internal `next` handling, provider-error redaction, confirmation-email state, and same-origin checks for auth mutations.
- Next.js 16 `src/proxy.ts` session refresh plus a second verified-user guard in the authenticated layout.
- Sign-out POST action and landing header/primary CTA routing to account entry.
- Browser and server Supabase clients use publishable configuration only; no service-role secret is added to client code.

Verification evidence:

- `npx tsc --noEmit`: pass.
- `npm run lint`: pass.
- `npm test -- --run`: 18 files, 124 tests passed, including redirect sanitization and same-origin mutation checks.
- `npm run build`: pass; Next.js reports Proxy plus the new dynamic auth routes.
- Production HTTP smoke: `/login` and `/register` return 200; logged-out `/app/timeline?filter=prevent` returns 307 to `/login?next=%2Fapp%2Ftimeline%3Ffilter%3Dprevent`; callback without a code returns to login with a safe error; foreign-origin login/sign-out return 403; same-origin malformed login returns a bounded 400.
- `npm run test:e2e`: 8 checks passed across desktop and mobile Chromium for landing-to-registration navigation, understandable validation, private-route redirect preservation, and cross-origin mutation rejection.
- Clean-install release gate: `npm ci`, lint, TypeScript, 124 unit/contract tests, and production build pass. `REL-001` is checked; other release gates remain open.

Remaining before MVP-010 can be `VERIFIED_DONE`:

- Test a real confirmed user through registration/login, cookie refresh, reload, expiry/refresh, and sign-out in a browser.
- Add browser automation rather than relying on HTTP-only smoke tests.
- Complete consent, pathway, and profile onboarding; the dashboard currently provides a safe path choice but does not persist it.

