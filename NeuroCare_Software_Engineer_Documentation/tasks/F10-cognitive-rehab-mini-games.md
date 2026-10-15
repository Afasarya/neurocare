# F10 - Cognitive Rehabilitation Mini-Games

> **Point:** Backlog - extension for NeuroRecovery  
> **Priority:** P2 / Backlog only  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** P0 completed; explicit approval; clinician/research review for accessibility and activity selection.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Document a future set of optional accessible concentration/memory activities with usage tracking only; never interpret game scores as cognitive diagnoses or treatment efficacy.

## 2. User stories

- Sebagai pengguna pascastroke, saya kelak dapat mencoba aktivitas kognitif sederhana sesuai kenyamanan saya.
- Saya dapat berhenti kapan saja tanpa hukuman atau label hasil negatif.
- Saya dapat melihat sesi yang dijalankan, bukan kesimpulan medis atas kemampuan otak saya.

## 3. Task checklist - UI / frontend

- [ ] [BACKLOG] Propose a single low-stress interaction (for example, image matching) pending expert approval, with adjustable pace and readable layout.
- [ ] [BACKLOG] Design large targets, no compulsory timer, reduced animation and keyboard operation.
- [ ] [BACKLOG] Show `sesi aktivitas` and accessible end session, not medical scoring.
- [ ] [BACKLOG] Keep route hidden behind a feature flag until end-to-end implementation is explicitly approved.

## 4. Task checklist - API / state / Supabase integration

- [ ] [BACKLOG] Define optional `cognitive_activity_sessions` with type, time/duration, completion and owner only.
- [ ] [BACKLOG] Decide whether any per-game performance value should be stored; default to activity counts only.
- [ ] [BACKLOG] Integrate with F08 timeline via real persisted sessions if implemented later.
- [ ] [BACKLOG] Keep interactions on device; avoid unnecessary data sharing and public leaderboard.

## 5. Data and contract notes

- Possible future `cognitive_activity_sessions`; do not add tables until P2 approval.

## 6. Safety, privacy and authorization checks

- [ ] No diagnosis, cognitive deficit grade or promised memory improvement.
- [ ] No public scoring/leaderboards for sensitive patient cohorts.

## 7. Required tests / demo scenarios

- [ ] If disabled, no misleading reachable route.
- [ ] If implemented: keyboard, reduced motion, easy stop and low-literacy instructions.
- [ ] If implemented: no false clinical scoring, owner-only read/write.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] Backlog objective and guardrails are recorded accurately.
- [ ] No unapproved mini-game is exposed to MVP users.
- [ ] If approved, ability to stop + accessibility + privacy and DoD are satisfied.

## 9. Explicitly out of scope

- Clinical cognitive testing or automated diagnosis.
- Gamified medical prognosis or comparison between patients.

## 10. External decisions / blockers

- Clinician-approved activity and research evidence/copy; explicit P2 prioritization.

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
