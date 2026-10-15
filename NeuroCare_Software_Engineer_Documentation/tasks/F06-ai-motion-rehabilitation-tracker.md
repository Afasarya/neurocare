# F06 - AI Motion Rehabilitation Tracker

> **Point:** B - NeuroRecovery  
> **Priority:** P1 / Stretch  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** BLOCKED / safe software foundation implemented
> **Dependencies:** F05 basic recovery UX; approved exercise/safety instruction; MediaPipe Pose model; AI Engineer repetition algorithm; camera consent; F08 data integration.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Provide an optional accessible camera-assisted session for one clinician-approved seated arm movement, displaying observed repetitions and duration without assigning clinical recovery scores.

## 2. User stories

- Saya dapat membaca instruksi satu latihan lengan duduk yang telah disetujui sebelum kamera aktif.
- Saya dapat memulai, menghentikan atau membatalkan sesi kapan saja; aplikasi mencatat jumlah repetisi terdeteksi dan durasi.
- Saya tidak diberi kesan bahwa hitungan repetisi membuktikan pemulihan medis.

## 3. Task checklist - UI / frontend

- [ ] Create `/app/recovery/activity` with safety notice, approved seated exercise instructions, start/pause/stop and optional noncamera back button.
- [ ] Use large controls, clear posture guidance and visible camera-on indicator.
- [x] Add `loading_model`, `camera_denied`, `unsupported`, `ready`, `tracking`, `low_confidence`, `paused`, `ended`, `error`, `emergency` states.
- [ ] Show repetition count and elapsed time only if validly produced by approved algorithm; label as `aktivitas terdeteksi`.
- [x] Use accessible textual feedback rather than a complex video overlay only; optional pose overlay must not be mandatory.
- [ ] Provide confirmation to save session, and return to F07/F08 after successful save.

## 4. Task checklist - API / state / Supabase integration

- [ ] Install/use `@mediapipe/tasks-vision` within a client-only lazy module; load compatible pretrained Pose Landmarker and model assets.
- [ ] Integrate AI Engineer-approved landmark (shoulder/elbow/wrist) selection, calibration, confidence gates and rep count algorithm via typed adapter **without recreating rules**.
- [ ] Run pose processing responsibly; throttle inference when needed for mobile performance and avoid storing video frames.
- [x] Stop camera tracks and release inference loop/resources when user stops, navigates or encounters error.
- [ ] Create authenticated `POST /api/recovery/activity` persistence endpoint; validate count >= 0, duration >= 0, activity ID/version and source.
- [ ] Enforce activity belongs to approved set; store session under current user and expose for F07/F08.
- [x] Use explicit stop and emergency-interruption behavior; never auto-declare medically safe to continue.

## 5. Data and contract notes

- `recovery_activities`: user_id, exercise_id, exercise_version, started_at, ended_at, duration_seconds, detected_reps, processing_quality, status.
- No raw video by default; only derived counts/times and approved limited metadata.
- `detected_reps` is an activity metric, not a clinical strength or rehabilitation score.

## 6. Safety, privacy and authorization checks

- [x] No filming before explicit consent and no unattended camera persistence.
- [ ] No medical exercise selection by LLM; use exactly one reviewed seated arm activity.
- [x] Sudden new stroke-like symptoms stop tracking and show urgent help.
- [ ] Session access is limited to owner via RLS.

## 7. Required tests / demo scenarios

- [ ] Approved activity video/demo performs correct count using AI Engineer test fixtures.
- [ ] Low confidence or occlusion does not inflate count; interruption does not mark completed falsely.
- [ ] Camera denied/model unavailable/offline state shows safe fallback.
- [ ] Pause/stop/unmount releases stream and processing loop; session duration is accurate.
- [ ] Mobile performance acceptable on target phone; no raw video saved.
- [ ] User B cannot read User A activities.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] Exactly one approved seated arm exercise is offered in P1.
- [ ] Camera/model resources are managed and sessions are explicitly controlled.
- [ ] Detected reps and duration are stored with model/activity provenance.
- [x] No clinical recovery grading or unsanctioned prescription appears.
- [ ] Confidence/error/emergency states and permission tests are covered.

## 9. Explicitly out of scope

- Designing rehab exercises without clinical review.
- Training new pose model or inventing repetition algorithm.
- Multiple exercises, therapy personalization or video upload.

## 10. External decisions / blockers

- Reviewed approved exercise and written precautions.
- AI Engineer model asset/version, landmark/rep-count adapter, confidence test fixtures.

## 11. Feature delivery report (agent fills after implementation)

- **Status:** BLOCKED - camera/model/API foundation is implemented fail-closed; approved exercise and AI algorithm inputs are still absent.
- **PR / commit:** Local working tree; no commit created.
- **Files added or changed:** `src/features/rehab-motion/**`, `src/app/app/recovery/activity/page.tsx`, `src/app/api/recovery/activity/route.ts`, app navigation, environment example, package manifests.
- **Schema migrations:** _none yet_
- **API contract / fixture reference:** Zod request/response boundary in `motion.contract.ts`; fail-closed development fixture in `server/motion-fixture.ts`.
- **Commands/tests actually run:** `npm run lint`; `npx tsc --noEmit`; `npm test`; `npm run build`; HTTP smoke test for the page and emergency API.
- **Manual device/accessibility/security checks:** Responsive/accessibility structure and consent/cleanup paths reviewed in code; real device, camera-permission, performance, auth isolation and RLS checks not run.
- **Known limitations / follow-up:** Obtain reviewed seated exercise/precautions, model asset/version, approved rep-count adapter and fixtures, then add throttled inference, authenticated persistence migration/RLS and F07/F08 read integration.

> **Task discipline:** Check boxes only after verification. P2 tasks remain backlog unless the human Software Engineer explicitly activates them. For all tasks, the universal Definition of Done in `PROJECT_CONTEXT.md` and `AGENTS.md` also applies.
