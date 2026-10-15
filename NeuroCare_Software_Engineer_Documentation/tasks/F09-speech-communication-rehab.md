# F09 - Speech & Communication Rehabilitation

> **Point:** Backlog - extension for NeuroRecovery  
> **Priority:** P2 / Backlog only  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** P0 completed; explicit team approval; speech specialist review; consent and accessibility review.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Reserve a future assistive communication/speech-practice pathway without claiming to diagnose or treat aphasia/dysarthria. This task is specification-only until approved.

## 2. User stories

- Sebagai pengguna pascastroke, saya kelak dapat menggunakan kartu frasa/piktogram pilihan sendiri untuk membantu komunikasi.
- Saya dapat mengakhiri latihan dan menyimpan catatan penggunaan yang bukan skor klinis.
- Jika suara atau mikrofon kelak dipakai, saya tahu data apa yang direkam dan dapat menolak izin.

## 3. Task checklist - UI / frontend

- [ ] [BACKLOG] Draft accessible UX for selectable phrase/picture cards, large type, tap-to-display and optional non-recording practice.
- [ ] [BACKLOG] Provide contextual instruction and stop button; no timing pressure or claims of therapy effectiveness.
- [ ] [BACKLOG] Plan empty/loading/assistive-access states and optional audio feedback toggle only with approved sources.
- [ ] [BACKLOG] Ensure feature flag hides unfinished route from MVP navigation.

## 4. Task checklist - API / state / Supabase integration

- [ ] [BACKLOG] Define proposed nonmedical practice session contract (`session_date`, `activity_type`, `completed`, `notes`) with clinical reviewer.
- [ ] [BACKLOG] Avoid microphone/voice cloud transmission by default; evaluate browser speech APIs only after permission/privacy decision.
- [ ] [BACKLOG] Plan owner-only Supabase schema/RLS and integration with F08 timeline if team approves.
- [ ] [BACKLOG] Keep any transcript or recording out of persistence by default; approval required for microphone feature.

## 5. Data and contract notes

- Possible future `communication_sessions` with minimal metadata; **no implementation in P0/P1**.

## 6. Safety, privacy and authorization checks

- [ ] No implied language diagnosis or speech-recovery scoring.
- [ ] No unauthorized microphone use, voice recording or external speech upload.

## 7. Required tests / demo scenarios

- [ ] When disabled, users cannot reach unfinished feature through navigation.
- [ ] If approved later: keyboard/accessibility and consent denial flows.
- [ ] If approved later: persistence and cross-user RLS isolation.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] Task remains documented as P2; not represented as completed product feature.
- [ ] A reviewed safe MVP boundary and data/privacy plan are documented before coding.
- [ ] If later approved, feature flag, non-diagnostic UX and auth checks meet DoD.

## 9. Explicitly out of scope

- Automated speech pathology diagnosis or clinically validated outcomes.
- Training an ASR/speech model for this hackathon.

## 10. External decisions / blockers

- Explicit P2 activation decision, speech professional content, privacy approval.

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
