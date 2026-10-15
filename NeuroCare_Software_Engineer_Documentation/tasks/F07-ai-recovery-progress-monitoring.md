# F07 - AI Recovery Progress Monitoring

> **Point:** B - NeuroRecovery  
> **Priority:** P0 / MVP  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** F05 check-ins; F08 unified history; F06 sessions if P1 implemented; AI Engineer recovery-insight contract optional but planned.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Visualize dated changes in self-report and activity adherence, explain incomplete data and optionally show bounded AI summaries without asserting clinically proven improvement.

## 2. User stories

- Saya dapat melihat jumlah check-in, aktivitas tercatat dan waktu aktivitas dalam rentang tanggal tertentu.
- Saya dapat membandingkan jawaban fungsi yang sama di beberapa waktu, disertai label `laporan mandiri`.
- Saya dapat melihat periode tanpa aktivitas dan ringkasan AI yang jujur jika datanya cukup, atau pemberitahuan data terbatas.

## 3. Task checklist - UI / frontend

- [ ] Create `/app/recovery/progress` dashboard with time filter, snapshot summary cards and charts via Recharts.
- [ ] Show independent summaries: check-in completion, user-reported question changes and exercise repetitions/duration (only when F06 is available).
- [ ] Add textual summaries and raw data table/accessible alternative for charts; units and date explicit.
- [ ] Handle no-baseline, one data point, sparse data, missing exercise feature, loading and error separately.
- [ ] Use neutrally phrased `perubahan catatan` instead of clinical `pemulihan meningkat 80%`.
- [ ] Provide link to new F05 check-in, activities (if enabled) and F08 history.
- [ ] Show AI-generated label and source when explanatory insight is available.

## 4. Task checklist - API / state / Supabase integration

- [ ] Fetch owner-only `recovery_checkins` + validated `recovery_activities` in a typed server data service.
- [ ] Compute **descriptive** aggregates only (counts, dates, durations, sum of valid reps), without new medical scoring.
- [ ] Normalize date sorting, timezone presentation and missing values consistently; never convert missing data to zero improvement.
- [ ] Agree `POST /api/ai/recovery-insight` structured insight with AI Engineer; only send minimum approved summarized values after consent.
- [ ] Validate model explanation and reject invented clinical claims/unsupported changes; use safe deterministic template on failure.
- [ ] Invalidate TanStack Query after F05/F06 writes; ensure charts reflect saved records.

## 5. Data and contract notes

- Reuse `recovery_checkins` and `recovery_activities`; avoid duplicating PHI in a new progress table without need.
- Keep provenance of exercise detection and self-reported values separate in charts.
- Optional `recovery_insights` storage only with explicit policy and source references.

## 6. Safety, privacy and authorization checks

- [ ] Previous stroke status never triggers primary-prevention WHO scoring.
- [ ] No clinical inference that session adherence == measured neurological recovery.
- [ ] If user reports sudden symptoms, emergency UX supersedes charts and AI narrative.
- [ ] Owner-only data access; no caregiver view in MVP by default.

## 7. Required tests / demo scenarios

- [ ] No baseline renders guidance to complete first F05 check-in.
- [ ] One and multiple check-ins show accurate dates and chart values.
- [ ] Activity metrics appear only from actual saved sessions; P1 absent gracefully hides exercise metric.
- [ ] AI text suggesting medical improvement without evidence is rejected/suppressed.
- [ ] Empty/invalid/missing data never produces 0% or invented outcome claims.
- [ ] Cross-user and stale cache tests pass.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] Progress page renders accurate descriptive trends for F05, and F06 if enabled.
- [ ] Every chart has a textual accessible explanation and source information.
- [ ] No implied clinical grading or false conclusion from limited data.
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

- **Status:** TODO / IN PROGRESS / BLOCKED / DONE
- **PR / commit:** _not started_
- **Files added or changed:** _not started_
- **Schema migrations:** _none yet_
- **API contract / fixture reference:** _not agreed yet_
- **Commands/tests actually run:** _not run_
- **Manual device/accessibility/security checks:** _not run_
- **Known limitations / follow-up:** _not recorded_

> **Task discipline:** Check boxes only after verification. P2 tasks remain backlog unless the human Software Engineer explicitly activates them. For all tasks, the universal Definition of Done in `PROJECT_CONTEXT.md` and `AGENTS.md` also applies.
