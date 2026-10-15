# F05 - Recovery Assessment & Check-in

> **Point:** B - NeuroRecovery  
> **Priority:** P0 / MVP  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** Auth, NeuroRecovery profile/pathway, emergency UX gate, Supabase tables/RLS and F08 timeline.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Enable post-stroke users to safely record a baseline and repeat self-reported functional check-ins, with clear history, without interpreting them as validated clinical recovery scores.

## 2. User stories

- Saya dapat menyimpan catatan kemampuan aktivitas harian dan kendala secara mandiri atau dengan bantuan.
- Saya dapat mengulang check-in dan mengetahui tanggal serta perubahan isian dibandingkan check-in sebelumnya.
- Saya mendapat peringatan layanan darurat jika melaporkan gejala stroke baru yang mendadak, bukan diarahkan meneruskan latihan.

## 3. Task checklist - UI / frontend

- [ ] Build `/app/recovery` check-in with step-by-step accessible questions, clear text, large targets and optional assistance note.
- [ ] Capture baseline once and later follow-up entries; clearly label `Penilaian mandiri` and time.
- [ ] Use questions/data fields reviewed by research teammate: activity completion, perceived limitation, new concerns, practice frequency as approved.
- [ ] Provide skip/unknown where appropriate, validation and explicit submission confirmation.
- [ ] Implement safety gate before functional questions and when new sudden symptoms are reported; show emergency screen and prevent routine exercise flow.
- [ ] Create check-in history/list with the ability to inspect past entries and a read-only baseline comparison.
- [ ] Handle first-time, no-history, save-error, network-loss and incomplete-entry states.

## 4. Task checklist - API / state / Supabase integration

- [ ] Implement React Hook Form + Zod schema with allowed response enums and optional text length limits.
- [ ] Create authenticated server action/Route Handler for create/list/details; derive user ownership from session.
- [ ] Use `recovery_checkins` table with timestamps, source=`self_report` (or assisted), completed status and versioned question set.
- [ ] Integrate saved entry into F08 timeline; expose typed data selector for F07 trend visuals.
- [ ] Define draft behavior (in-memory only, or approved server draft) and prevent accidental double-submission.
- [ ] Preserve exact patient-entered response vs calculated display transformations.

## 5. Data and contract notes

- `recovery_checkins`: user_id, recorded_at, instrument_version, self_report answers (reviewed schema), optional source/assistance mode and notes.
- Consider separate `recovery_baseline` pointer or mark earliest valid entry; avoid duplicated rows or arbitrary overwrite.
- Do not label summed answers as a Modified Barthel Index unless authorized standardized form/admin protocol exists.

## 6. Safety, privacy and authorization checks

- [ ] Self-reported data is sensitive; owner-only RLS and no unapproved caregiver sharing.
- [ ] App never claims a user is medically safe to perform exercise based on this check-in.
- [ ] Any new sudden stroke-like symptom takes precedence over data entry and navigates to urgent-help guidance.

## 7. Required tests / demo scenarios

- [ ] First check-in establishes baseline and appears in history and timeline.
- [ ] Follow-up stored with correct date and independent values; baseline remains unchanged.
- [ ] Incomplete/invalid form shows field-specific errors and saves nothing.
- [ ] Immediate new symptoms interrupt flow.
- [ ] Expired login, retry and double-submit do not produce unexpected records.
- [ ] User B cannot access User A reports.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] NeuroRecovery user can create and view baseline/follow-up self-report safely.
- [ ] History clearly marks user-reported data and original timestamp.
- [ ] No clinical grade or unapproved standardized scale is invented.
- [ ] Emergency UX interrupts regular activity/check-in flow.
- [ ] Authorization, validation, baseline integrity and accessibility tests pass.

## 9. Explicitly out of scope

- Diagnosis of impairment or automatic eligibility for physical exercise.
- Implementing Modified Barthel Index without a reviewed valid protocol.
- Scheduling medically prescribed therapy.

## 10. External decisions / blockers

- Approved self-report question set and emergency copy.
- Decision about baseline and assisted-entry data fields.

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
