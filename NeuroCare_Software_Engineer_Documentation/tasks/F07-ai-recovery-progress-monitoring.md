# F07 - AI Recovery Progress Monitoring

> **Point:** B - NeuroRecovery  
> **Priority:** P0 / MVP  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** BLOCKED / safe dashboard foundation implemented
> **Dependencies:** F05 check-ins; F08 unified history; F06 sessions if P1 implemented; AI Engineer recovery-insight contract optional but planned.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Visualize dated changes in self-report and activity adherence, explain incomplete data and optionally show bounded AI summaries without asserting clinically proven improvement.

## 2. User stories

- Saya dapat melihat jumlah check-in, aktivitas tercatat dan waktu aktivitas dalam rentang tanggal tertentu.
- Saya dapat membandingkan jawaban fungsi yang sama di beberapa waktu, disertai label `laporan mandiri`.
- Saya dapat melihat periode tanpa aktivitas dan ringkasan AI yang jujur jika datanya cukup, atau pemberitahuan data terbatas.

## 3. Task checklist - UI / frontend

- [x] Create `/app/recovery/progress` dashboard with time filter, snapshot summary cards and charts via Recharts.
- [x] Show independent summaries: check-in completion, user-reported question changes and exercise repetitions/duration (only when F06 is available).
- [x] Add textual summaries and raw data table/accessible alternative for charts; units and date explicit.
- [x] Handle no-baseline, one data point, sparse data, missing exercise feature, loading and error separately.
- [x] Use neutrally phrased `perubahan catatan` instead of clinical `pemulihan meningkat 80%`.
- [ ] Provide link to new F05 check-in, activities (if enabled) and F08 history.
- [ ] Show AI-generated label and source when explanatory insight is available.

## 4. Task checklist - API / state / Supabase integration

- [ ] Fetch owner-only `recovery_checkins` + validated `recovery_activities` in a typed server data service.
- [x] Compute **descriptive** aggregates only (counts, dates, durations, sum of valid reps), without new medical scoring.
- [x] Normalize date sorting, timezone presentation and missing values consistently; never convert missing data to zero improvement.
- [ ] Agree `POST /api/ai/recovery-insight` structured insight with AI Engineer; only send minimum approved summarized values after consent.
- [ ] Validate model explanation and reject invented clinical claims/unsupported changes; use safe deterministic template on failure.
- [ ] Invalidate TanStack Query after F05/F06 writes; F05 is covered, but F06 still has no approved successful write path.

## 5. Data and contract notes

- Reuse `recovery_checkins` and `recovery_activities`; avoid duplicating PHI in a new progress table without need.
- Keep provenance of exercise detection and self-reported values separate in charts.
- Optional `recovery_insights` storage only with explicit policy and source references.

## 6. Safety, privacy and authorization checks

- [x] Previous stroke status never triggers primary-prevention WHO scoring.
- [x] No clinical inference that session adherence == measured neurological recovery.
- [x] If user reports sudden symptoms, emergency UX supersedes charts and AI narrative.
- [ ] Owner-only data access; no caregiver view in MVP by default.

## 7. Required tests / demo scenarios

- [ ] No baseline renders guidance to complete first F05 check-in.
- [x] One and multiple check-ins show accurate dates and chart values in validated synthetic fixtures.
- [x] Activity metrics use validated completed sessions; P1 absent gracefully hides exercise metric.
- [x] AI text suggesting medical improvement without evidence is rejected/suppressed by the current fail-closed contract.
- [x] Empty/invalid/missing data never produces 0% or invented outcome claims.
- [ ] Cross-user and stale cache tests pass.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] Progress page renders accurate descriptive trends for F05, and F06 if enabled.
- [x] Every chart has a textual accessible explanation and source information.
- [x] No implied clinical grading or false conclusion from limited data.
- [ ] Structured optional AI explanation cannot alter source records.
- [ ] Empty/loading/error and auth isolation behaviors pass tests.

## 9. Explicitly out of scope

- Deriving NIHSS, Barthel or clinical recovery percentage from pose/session data.
- Medical prognosis or therapy recommendation.
- Making F06 mandatory for F07 MVP.

## 10. External decisions / blockers

- Final F05 question set and meaning of trend comparisons.
- AI Engineer approved recovery-insight structured schema, if that subfeature is enabled.

## 11. Feature delivery report (agent fills after implementation)

- **Status:** BLOCKED - typed dashboard/API foundation works with synthetic fixtures; production schema/RLS and optional AI contract remain unavailable.
- **PR / commit:** Local working tree; no commit created.
- **Files added or changed:** `src/features/recovery-progress/**`, `/app/recovery/progress`, `/api/recovery/progress`, F05 query invalidation, and app navigation.
- **Schema migrations:** _none yet_
- **API contract / fixture reference:** `progress.contract.ts`; synthetic scenarios in `server/progress-fixture.ts`; production owner filter in `server/progress-service.ts`.
- **Commands/tests actually run:** `npx tsc --noEmit`; `npm run lint`; `npm test`; `npm run build`; HTTP smoke tests for page, multi-check-in API and empty API.
- **Manual device/accessibility/security checks:** Semantic table, textual chart alternative, keyboard controls and no-store API reviewed in code; real mobile/screen-reader, authenticated two-user isolation and RLS tests not run.
- **Known limitations / follow-up:** Finalize F05 database shape and RLS, enable validated F06 persistence, test same-user/cross-user access, implement F08 route, and agree optional AI recovery-insight contract before enabling AI copy.

> **Task discipline:** Check boxes only after verification. P2 tasks remain backlog unless the human Software Engineer explicitly activates them. For all tasks, the universal Definition of Done in `PROJECT_CONTEXT.md` and `AGENTS.md` also applies.
