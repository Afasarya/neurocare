# F09 - Speech & Communication Rehabilitation

> **Point:** Backlog - extension for NeuroRecovery  
> **Priority:** P2 / Backlog only  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** BLOCKED / feature-flagged safe prototype
> **Dependencies:** P0 completed; explicit team approval; speech specialist review; consent and accessibility review.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Reserve a future assistive communication/speech-practice pathway without claiming to diagnose or treat aphasia/dysarthria. This task is specification-only until approved.

## 2. User stories

- Sebagai pengguna pascastroke, saya kelak dapat menggunakan kartu frasa/piktogram pilihan sendiri untuk membantu komunikasi.
- Saya dapat mengakhiri latihan dan menyimpan catatan penggunaan yang bukan skor klinis.
- Jika suara atau mikrofon kelak dipakai, saya tahu data apa yang direkam dan dapat menolak izin.

## 3. Task checklist - UI / frontend

- [x] [BACKLOG] Draft accessible UX for selectable phrase/picture cards, large type, tap-to-display and optional non-recording practice.
- [x] [BACKLOG] Provide contextual instruction and stop button; no timing pressure or claims of therapy effectiveness.
- [x] [BACKLOG] Plan empty/loading/assistive-access states and optional audio feedback toggle only with approved sources.
- [x] [BACKLOG] Ensure feature flag hides unfinished route from MVP navigation.

## 4. Task checklist - API / state / Supabase integration

- [ ] [BACKLOG] Define proposed nonmedical practice session contract (`session_date`, `activity_type`, `completed`, `notes`) with clinical reviewer.
- [x] [BACKLOG] Avoid microphone/voice cloud transmission by default; evaluate browser speech APIs only after permission/privacy decision.
- [x] [BACKLOG] Plan owner-only Supabase schema/RLS and integration with F08 timeline if team approves.
- [x] [BACKLOG] Keep any transcript or recording out of persistence by default; approval required for microphone feature.

## 5. Data and contract notes

- Possible future `communication_sessions` with minimal metadata; **no implementation in P0/P1**.
- Draft contract `f09-draft-v1` contains only `session_date`, `activity_type`, `completed`, optional notes, source, request ID and contract version. It rejects browser-supplied ownership, transcript, recording, diagnosis and score fields.
- If approved, a future migration must derive `user_id` from authenticated server context, enable owner-only CRUD RLS, constrain activity types/timestamps, and define deletion/retention before F08 timeline integration. No migration has been created from this unreviewed draft.
- The current development adapter returns `simulated`, never `saved`. Production persistence fails closed until the schema and RLS are approved and tested with two identities.

## 6. Safety, privacy and authorization checks

- [x] No implied language diagnosis or speech-recovery scoring.
- [x] No unauthorized microphone use, voice recording or external speech upload.

## 7. Required tests / demo scenarios

- [x] When disabled, users cannot reach unfinished feature through navigation.
- [ ] If approved later: keyboard/accessibility and consent denial flows.
- [ ] If approved later: persistence and cross-user RLS isolation.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [x] Task remains documented as P2; not represented as completed product feature.
- [ ] A reviewed safe MVP boundary and data/privacy plan are documented before coding.
- [ ] If later approved, feature flag, non-diagnostic UX and auth checks meet DoD.

## 9. Explicitly out of scope

- Automated speech pathology diagnosis or clinically validated outcomes.
- Training an ASR/speech model for this hackathon.

## 10. External decisions / blockers

- Explicit P2 activation decision, speech professional content, privacy approval.

## 11. Feature delivery report (agent fills after implementation)

- **Status:** BLOCKED — feature-flagged safe prototype; not a completed product feature
- **PR / commit:** local working tree only; no commit created
- **Files added or changed:** `src/features/communication-rehab/**`, `src/app/app/recovery/communication/page.tsx`, `src/app/api/recovery/communication-sessions/route.ts`, app navigation, `.env.example`, and this task file
- **Schema migrations:** none; proposed owner-only schema requires product/privacy review and two-user RLS validation
- **API contract / fixture reference:** `f09-draft-v1`; development header `X-NeuroCare-Communication-Demo: communication-fixture-v1`; response is explicitly `simulated`
- **Commands/tests actually run:** `npx tsc --noEmit` passed; `npm run lint` passed; `npm test -- --run` passed (15 files, 78 tests); `npm run build` passed on Next.js 16.4.1; HTTP smoke checks passed for disabled page/API 404 with no navigation item, enabled page 200 with navigation item, and development response `simulated` with `Cache-Control: private, no-store, max-age=0`.
- **Manual device/accessibility/security checks:** native button/textarea/checkbox semantics, large touch targets, visible focus utility, `aria-pressed`, live selected phrase and text alternatives implemented; physical device and screen-reader checks remain pending
- **Known limitations / follow-up:** route/navigation are disabled unless `FEATURE_F09_COMMUNICATION_REHAB=true`; no microphone/audio/transcript, custom cards, persistence, history or F08 integration; speech-specialist, privacy, retention, accessibility and schema/RLS approvals remain required

> **Task discipline:** Check boxes only after verification. P2 tasks remain backlog unless the human Software Engineer explicitly activates them. For all tasks, the universal Definition of Done in `PROJECT_CONTEXT.md` and `AGENTS.md` also applies.
