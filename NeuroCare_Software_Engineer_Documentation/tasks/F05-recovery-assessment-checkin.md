# F05 - Recovery Assessment & Check-in

> **Point:** B - NeuroRecovery  
> **Priority:** P0 / MVP  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** IN PROGRESS / safe demo shell implemented; approved questions and persistence pending
> **Dependencies:** Auth, NeuroRecovery profile/pathway, emergency UX gate, Supabase tables/RLS and F08 timeline.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Enable post-stroke users to safely record a baseline and repeat self-reported functional check-ins, with clear history, without interpreting them as validated clinical recovery scores.

## 2. User stories

- Saya dapat menyimpan catatan kemampuan aktivitas harian dan kendala secara mandiri atau dengan bantuan.
- Saya dapat mengulang check-in dan mengetahui tanggal serta perubahan isian dibandingkan check-in sebelumnya.
- Saya mendapat peringatan layanan darurat jika melaporkan gejala stroke baru yang mendadak, bukan diarahkan meneruskan latihan.

## 3. Task checklist - UI / frontend

- [x] Build `/app/recovery` check-in with step-by-step accessible questions, clear text, large targets and optional assistance note.
- [x] Capture baseline once and later follow-up entries; clearly label `Penilaian mandiri` and time.
- [ ] Use questions/data fields reviewed by research teammate: activity completion, perceived limitation, new concerns, practice frequency as approved.
- [x] Provide skip/unknown where appropriate, validation and explicit submission confirmation.
- [x] Implement safety gate before functional questions and when new sudden symptoms are reported; show emergency screen and prevent routine exercise flow.
- [x] Create check-in history/list with the ability to inspect past entries and a read-only baseline comparison.
- [x] Handle first-time, no-history, save-error, network-loss and incomplete-entry states.

## 4. Task checklist - API / state / Supabase integration

- [x] Implement React Hook Form + Zod schema with allowed response enums and optional text length limits.
- [ ] Create authenticated server action/Route Handler for create/list/details; derive user ownership from session.
- [ ] Use `recovery_checkins` table with timestamps, source=`self_report` (or assisted), completed status and versioned question set.
- [ ] Integrate saved entry into F08 timeline; expose typed data selector for F07 trend visuals.
- [x] Define draft behavior (in-memory only, or approved server draft) and prevent accidental double-submission.
- [x] Preserve exact patient-entered response vs calculated display transformations.

## 5. Data and contract notes

- `recovery_checkins`: user_id, recorded_at, instrument_version, self_report answers (reviewed schema), optional source/assistance mode and notes.
- Consider separate `recovery_baseline` pointer or mark earliest valid entry; avoid duplicated rows or arbitrary overwrite.
- Do not label summed answers as a Modified Barthel Index unless authorized standardized form/admin protocol exists.

## 6. Safety, privacy and authorization checks

- [ ] Self-reported data is sensitive; owner-only RLS and no unapproved caregiver sharing.
- [x] App never claims a user is medically safe to perform exercise based on this check-in.
- [x] Any new sudden stroke-like symptom takes precedence over data entry and navigates to urgent-help guidance.

## 7. Required tests / demo scenarios

- [ ] First check-in establishes baseline and appears in history and timeline.
- [ ] Follow-up stored with correct date and independent values; baseline remains unchanged.
- [x] Incomplete/invalid form shows field-specific errors and saves nothing.
- [x] Immediate new symptoms interrupt flow.
- [ ] Expired login, retry and double-submit do not produce unexpected records.
- [ ] User B cannot access User A reports.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] NeuroRecovery user can create and view baseline/follow-up self-report safely.
- [x] History clearly marks user-reported data and original timestamp.
- [x] No clinical grade or unapproved standardized scale is invented.
- [x] Emergency UX interrupts regular activity/check-in flow.
- [ ] Authorization, validation, baseline integrity and accessibility tests pass.

## 9. Explicitly out of scope

- Diagnosis of impairment or automatic eligibility for physical exercise.
- Implementing Modified Barthel Index without a reviewed valid protocol.
- Scheduling medically prescribed therapy.

## 10. External decisions / blockers

- Approved self-report question set and emergency copy.
- Decision about baseline and assisted-entry data fields.

## 11. Feature delivery report (agent fills after implementation)

- **Status:** IN PROGRESS — accessible UI, strict contract, safe demo APIs and selectors exist; production persistence remains blocked by the unapproved question set, database/RLS design and missing F08 foundation.
- **PR / commit:** Working tree implementation; no commit created by this agent.
- **Files added or changed:** `src/app/app/recovery/page.tsx`, `src/app/api/recovery/checkins/**`, `src/features/recovery/**`, and app navigation in `src/app/app/layout.tsx`.
- **Schema migrations:** _none yet_
- **API contract / fixture reference:** Proposed strict contract `recovery-demo-pending-review-v1`; development scenarios `baseline`, `empty`, `unavailable`, `save-error`, and `network-error`. The fixture question set is visibly marked pending review and cannot be persisted in production.
- **Commands/tests actually run:** `npx tsc --noEmit`; `npm run lint`; `npm test` (48 passed); `npm run build`; HTTP smoke check (`/app/recovery` 200, list/detail `ok`, follow-up `saved`, baseline preserved, emergency returned without check-in, malformed payload 400, oversized payload 413).
- **Manual device/accessibility/security checks:** Large controls, labels, field errors, progress semantics, alerts and keyboard-focus styles reviewed in code. Real assistive-technology testing, authenticated database writes, expired-session behavior and two-user RLS isolation were not run.
- **Known limitations / follow-up:** Obtain research/clinical approval for the question set, emergency copy, assistance fields and baseline policy. Then add reviewed `recovery_checkins` migration with owner-only RLS, connect authenticated create/list/detail queries, integrate F08 timeline persistence, test two users, and replace demo-only in-memory history.

> **Task discipline:** Check boxes only after verification. P2 tasks remain backlog unless the human Software Engineer explicitly activates them. For all tasks, the universal Definition of Done in `PROJECT_CONTEXT.md` and `AGENTS.md` also applies.
