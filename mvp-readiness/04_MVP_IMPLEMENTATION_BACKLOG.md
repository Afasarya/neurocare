# MVP Readiness Implementation Backlog

## How to use
This is a *proposed order of work*, not a factual completion report. Agent must first audit and mark each item `VERIFIED_DONE`, `PARTIAL`, `BLOCKED`, or `NOT_STARTED` with evidence.

## Phase 0 — Evidence and architecture alignment (P0)
- [ ] **MVP-000** Audit source, routes, DB, UX, API, docs; save `ACTUAL_AUDIT_RESULTS.md`.
- [ ] **MVP-001** Repair root `AGENTS.md`: link canonical product and engineering docs; preserve Next.js 16 compatibility guidance.
- [ ] **MVP-002** Replace create-next-app README with real setup guide, env var names, architecture, test commands, fixture/live modes.
- [ ] **MVP-003** Build route matrix; annotate dead routes, orphan pages, unexpected redirect, missing auth guards.
- [ ] **MVP-004** Establish verification gates: lint, TypeScript, test, production build, browser flow smoke.

## Phase 1 — Shared foundation (P0; prerequisites for every feature)
- [ ] **MVP-010** Verify Supabase browser/server clients, cookie/session refresh, authenticated route guarding.
- [ ] **MVP-011** Version controlled schema migrations; tables support all P0 flows.
- [ ] **MVP-012** RLS policies and two-user isolation automated/manual test. No service keys in client.
- [ ] **MVP-013** Common form patterns: react-hook-form + Zod, validation, unknown data states, error summary, safe draft/back behavior.
- [ ] **MVP-014** Shared layout: top page title, breadcrumb/back, steps, mobile nav, persistent Help, toast notifications.
- [ ] **MVP-015** Shared empty/loading/success/error/offline UI; retry and duplicate-submit prevention.
- [ ] **MVP-016** Consent and privacy basics: data purpose, optional AI/camera permissions, record ownership; retention/delete/export decisions documented.
- [ ] **MVP-017** Emergency symptom triage, tested independent of AI availability.

## Phase 2 — End-to-end P0 pathways
- [ ] **F12 Landing and first use:** clear two-path CTA, route correctly to registration/welcome/onboarding, responsive and accurate copy.
- [ ] **F01 Screening:** forms, steps, validations, age/history eligibility routing, result view, storage, fixture/API adapter; WHO logic belongs to AI Engineer.
- [ ] **F02 Screening gaps:** missing/unknown checks visibly identified, accessible next-action cards, saved links to action plan; deterministic rule contract agreed with AI Engineer.
- [ ] **F04 Health insight:** loading, error, retry, consent, structured fixture adapter, visible mode badge, save or retrieve result; no fake clinical advice.
- [ ] **F05 Recovery check-in:** onboarding/baseline, form completion, saved records, history and edit constraints; no unvalidated clinical scale.
- [ ] **F07 Progress:** chart over actual saved check-ins, correct no-trend empty state, summaries, separate AI explanation adapter.
- [ ] **F08 Timeline/planner:** chronological events, records owned by user, add/mark follow-up, filter by journey, data consistency after reload.
- [ ] **MVP-020** Prevent journey E2E and Recovery journey E2E pass on fixture mode with synthetic data.

## Phase 3 — P1 after P0 works
- [ ] **F03 Camera PPG:** user permission and guidance, test supported phones, validated sample pipeline, BPM-only output and fallback. Never show mock BPM as measured.
- [ ] **F06 Motion tracker:** one approved exercise, MediaPipe + camera fallback, accessible instructions, real session timestamps and counts if validated.

## Phase 4 — P2 backlog; no silent omission
- [ ] **F09 Speech & communication:** explicitly mark `BACKLOG` unless approved content, safe flow, permissions, and testing exist.
- [ ] **F10 Cognitive mini-games:** `BACKLOG`; define interaction and accessibility before build.
- [ ] **F11 Caregiver dashboard:** `BACKLOG`; requires explicit patient consent, caregiver roles, strict RLS.

## Phase 5 — UX acceptance (P0)
- [ ] **UX-001** Path-aware onboarding; first-use user always sees next step.
- [ ] **UX-002** Consistent screen templates for forms, results, timelines and check-ins.
- [ ] **UX-003** Dashboard CTA adapts to first use / incomplete draft / saved record.
- [ ] **UX-004** Explain age 18–39 vs 40–59 output with everyday Indonesian copy.
- [ ] **UX-005** Mobile, keyboard, accessibility, screen-reader labels and chart summary.
- [ ] **UX-006** Test with at least three novice users; log confusion points and fix top blockers.

## Phase 6 — Release gates
- [ ] **REL-001** `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` pass.
- [ ] **REL-002** Auth/RLS negative tests on two accounts.
- [ ] **REL-003** Prevent + Recovery successful persistence after reload.
- [ ] **REL-004** AI timeout/invalid response and offline fallback tests.
- [ ] **REL-005** No placeholder UI/clinical claims/inert CTA on P0 route.
- [ ] **REL-006** Final evidence report with blocked live-AI contract items explicitly disclosed.

## Status template per task
```
Task ID:
Current status:
Evidence: src/.../file.tsx:Lx, test name, screenshot, or command output
What works:
What does not:
External AI dependency:
Next change:
Acceptance test:
Verified by/date:
```

## Stop rules
Do not start P1 until P0 E2E + safety/security gates pass. Do not build P2 as a substitute for fixing broken onboarding. Do not check off clinical-engine work the Software Engineer doesn't own. Do not make the release dependent on live AI if the agreed state is 'READY FOR AI INTEGRATION'.
