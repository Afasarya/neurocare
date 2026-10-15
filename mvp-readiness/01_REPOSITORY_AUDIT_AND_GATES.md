# Repository Audit & Quality Gates (evidence required)

## 1. Confirmed public observations (2026-10-16)
- Public repo: `github.com/Afasarya/neurocare`, default branch `main`.
- `package.json`: `next@16.4.1`, `react@19.3.0`, `@supabase/ssr`, `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `recharts`, `@mediapipe/tasks-vision`, `vitest`.
- Root `AGENTS.md` visible on GitHub consists of Next.js version caution, not the comprehensive NeuroCare-specific policy document described in project planning.
- Root `README.md` visible on GitHub still carries create-next-app boilerplate.
- **Not inspected:** full contents of `src/`, SQL migrations, runtime UX, deployed app, tests, env setup, database policies. Do not extrapolate.

## 2. Audit deliverable: `ACTUAL_AUDIT_RESULTS.md`
For every finding write:
`Finding ID | Severity (blocker/high/medium/low) | Feature | Current behavior | Evidence (file:line/test/reproduction) | Expected behavior | Proposed fix | Owner | Status`.
Do not use "implemented" without code reference + verification; do not use "not implemented" unless repository inspected.

## 3. Inventory commands
Run locally at repo root:
```bash
node -v
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build
```
Inspect and record:
- Complete `src/app/` route tree, route guards, redirects, back/forward behavior.
- `src/features/`, `src/components/`, server actions, Next.js route handlers.
- `supabase/` migrations, policies, table types; any SQL committed elsewhere.
- Env vars: document **names only**, never reveal secrets.
- `src/proxy.ts` or current Next.js session-refresh mechanism (verify runtime and compatibility).
- Browser and server Supabase clients; ensure cookies, authentication, identity checks.
- Logging, analytics, error boundaries, loading states, accessibility.
- Actual AI adapter(s) vs fixtures and any UI fake completion states.
- README, root AGENTS guidance vs nested docs; ensure agents see current requirements.

## 4. Checklist status policy
Use one of: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED_EXTERNAL_AI`, `BLOCKED_DECISION`, `IMPLEMENTED_UNTESTED`, `VERIFIED_DONE`.
- `VERIFIED_DONE` only with file reference, automated test or reproducible manual test, plus reviewer date.
- Split combined checklist items that mix completed UI and incomplete API integration.
- Keep AI-live acceptance separate from Software Engineer integration readiness.
- When uncertain, mark `UNVERIFIED`, request evidence; never auto-tick.

## 5. Hard gates before feature-complete claim
### Auth / authorization
- Unauthenticated user cannot read authenticated dashboard data.
- Each private data query is filtered/authorized by verified server identity.
- Supabase RLS enabled on *every* user-owned table.
- Two-account test: Account A cannot read/update/delete Account B records (database and API attempts).
- No service-role/secret key in client bundles; `.env.local` excluded from git.
- Session refresh verified, including browser reload and expiration.
### Data & workflows
- Save → refresh page → view persisted data → return after sign-in.
- Back navigation preserves safe form draft state or explicitly warns before discarding.
- Empty, loading, network failure, API unavailable, invalid input states behave correctly.
- No simulated output presented as actual patient or AI analysis.
### Safety
- Emergency stroke symptom screen takes precedence over assessment/rehabilitation; direct users to urgent local services; never wait for AI response.
- Previous stroke/TIA/CVD users are not given primary-prevention WHO CVD score.
- Age 18–39 users do not receive WHO chart score; use risk-factor/gap reporting.
- WHO non-lab chart result must be clearly labeled 10-year **CVD event** risk, NOT stroke-specific.
- PPG output, if shown, is pulse BPM only—not blood pressure, AF diagnosis, or stroke prediction.
### Build & quality
- lint, TypeScript, tests, production build pass; document exceptions with reason.
- Check small-screen (360/390px), medium tablet, desktop, reduced-motion, and keyboard.
- Verify no placeholder `#` links, misleading disabled CTAs, or unexplained empty cards.

## 6. End-to-end smoke paths
**Prevent:** landing → register/login → consent → select Prevent → profile → screening → gap review → AI fixture (labeled) → actions → persisted timeline → sign out/in → record present.
**Recovery:** landing → register/login → consent → select Recovery → baseline → check-in → activity log (if available) → progress from real stored records → timeline → refresh.
**Safety:** emergency symptom answer redirects immediately to urgent guidance; cannot continue ordinary scoring.
**Error:** AI service times out → clear notice + non-AI findings retained + retry; no fabricated response.

## 7. Release readiness report template
```
Commit SHA:
Environment (no secrets):
Lint / TypeScript / Test / Build:
Auth / RLS evidence:
Prevent E2E evidence:
Recovery E2E evidence:
Mobile UX evidence:
AI fixtures vs live modules:
Open P0 blockers:
Release decision: READY_FOR_AI_INTEGRATION | NOT_READY
```
