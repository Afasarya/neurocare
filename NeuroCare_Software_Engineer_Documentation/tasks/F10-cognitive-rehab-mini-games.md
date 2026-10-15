# F10 - Cognitive Rehabilitation Mini-Games

> **Point:** Backlog - extension for NeuroRecovery  
> **Priority:** P2 / Backlog only  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** BLOCKED / feature-flagged safe prototype
> **Dependencies:** P0 completed; explicit approval; clinician/research review for accessibility and activity selection.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Document a future set of optional accessible concentration/memory activities with usage tracking only; never interpret game scores as cognitive diagnoses or treatment efficacy.

## 2. User stories

- Sebagai pengguna pascastroke, saya kelak dapat mencoba aktivitas kognitif sederhana sesuai kenyamanan saya.
- Saya dapat berhenti kapan saja tanpa hukuman atau label hasil negatif.
- Saya dapat melihat sesi yang dijalankan, bukan kesimpulan medis atas kemampuan otak saya.

## 3. Task checklist - UI / frontend

- [x] [BACKLOG] Propose a single low-stress interaction (for example, image matching) pending expert approval, with adjustable pace and readable layout.
- [x] [BACKLOG] Design large targets, no compulsory timer, reduced animation and keyboard operation.
- [x] [BACKLOG] Show `sesi aktivitas` and accessible end session, not medical scoring.
- [x] [BACKLOG] Keep route hidden behind a feature flag until end-to-end implementation is explicitly approved.

## 4. Task checklist - API / state / Supabase integration

- [x] [BACKLOG] Define optional `cognitive_activity_sessions` with type, time/duration, completion and owner only.
- [x] [BACKLOG] Decide whether any per-game performance value should be stored; default to activity counts only.
- [ ] [BACKLOG] Integrate with F08 timeline via real persisted sessions if implemented later.
- [x] [BACKLOG] Keep interactions on device; avoid unnecessary data sharing and public leaderboard.

## 5. Data and contract notes

- Possible future `cognitive_activity_sessions`; do not add tables until P2 approval.
- Draft contract `f10-draft-v1` contains only start/end timestamps, activity type, completion, end reason, source, request ID and contract version. Duration may be derived from timestamps by an approved server implementation; it is not displayed as performance.
- No score, accuracy, attempts, errors, reaction time, diagnosis or difficulty recommendation is accepted or persisted. The development adapter returns `simulated`, never `saved`.
- If approved, a future table must derive ownership from authenticated server context, use owner-only CRUD RLS, define retention/deletion, and pass two-user isolation tests before integration with the F08 timeline. No migration has been added from this unreviewed draft.

## 6. Safety, privacy and authorization checks

- [x] No diagnosis, cognitive deficit grade or promised memory improvement.
- [x] No public scoring/leaderboards for sensitive patient cohorts.

## 7. Required tests / demo scenarios

- [x] If disabled, no misleading reachable route.
- [ ] If implemented: keyboard, reduced motion, easy stop and low-literacy instructions.
- [ ] If implemented: no false clinical scoring, owner-only read/write.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [x] Backlog objective and guardrails are recorded accurately.
- [x] No unapproved mini-game is exposed to MVP users.
- [ ] If approved, ability to stop + accessibility + privacy and DoD are satisfied.

## 9. Explicitly out of scope

- Clinical cognitive testing or automated diagnosis.
- Gamified medical prognosis or comparison between patients.

## 10. External decisions / blockers

- Clinician-approved activity and research evidence/copy; explicit P2 prioritization.

## 11. Feature delivery report (agent fills after implementation)

- **Status:** BLOCKED — feature-flagged safe prototype; not a reviewed rehabilitation activity or completed product feature
- **PR / commit:** local working tree only; no commit created
- **Files added or changed:** `src/features/cognitive-activities/**`, `src/app/app/recovery/cognitive-activity/page.tsx`, `src/app/api/recovery/cognitive-activity-sessions/route.ts`, app navigation, `.env.example`, and this task file
- **Schema migrations:** none; proposed owner-only storage requires activity/privacy review and two-user RLS validation
- **API contract / fixture reference:** `f10-draft-v1`; development header `X-NeuroCare-Cognitive-Demo: cognitive-fixture-v1`; response is explicitly `simulated`
- **Commands/tests actually run:** `npx tsc --noEmit` passed; `npm run lint` passed; `npm test -- --run` passed after the Zod contract correction (16 files, 94 tests); `npm run build` passed on Next.js 16.4.1; disabled HTTP smoke checks returned page/API 404 with no navigation item and private no-store API headers; an enabled production API check returned 401 without authentication as required; enabled navigation and simulated fixture behavior passed unit tests.
- **Manual device/accessibility/security checks:** semantic buttons/radios/checkbox, large targets, visible focus utility, text alternatives, live status, no automatic mismatch timer, and reduced-motion loading behavior implemented; physical device and screen-reader checks remain pending
- **Known limitations / follow-up:** route/navigation are disabled unless `FEATURE_F10_COGNITIVE_ACTIVITIES=true`; no production persistence, history, F08 integration, clinical interpretation, performance metrics or adaptive difficulty; clinician/research, privacy, accessibility and schema/RLS approvals remain required

> **Task discipline:** Check boxes only after verification. P2 tasks remain backlog unless the human Software Engineer explicitly activates them. For all tasks, the universal Definition of Done in `PROJECT_CONTEXT.md` and `AGENTS.md` also applies.
