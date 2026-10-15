# F03 - Camera-Based PPG Monitoring

> **Point:** A - NeuroPrevent  
> **Priority:** P1 / Stretch  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** Camera-capable HTTPS device; consent; Supabase auth; AI Engineer PPG processing/quality contract; F08 session history.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Capture a short rear-camera optical pulse signal, request BPM analysis, and show only signal-quality-validated heart-rate estimate. No BP or stroke/AF diagnosis.

## 2. User stories

- Saya memahami bahwa ini hanya estimasi detak jantung, dapat menolak kamera, dan bisa mencoba ulang.
- Saya dapat mengikuti instruksi pengukuran, menghentikannya, dan menerima BPM hanya ketika sinyal layak.
- Saya dapat melihat hasil, waktu, kualitas pengukuran dan keterbatasan pada timeline.

## 3. Task checklist - UI / frontend

- [ ] Create `/app/pulse-monitor` with disclaimer, device requirements, instructions, explicit camera consent, recording progress and cancel/retry.
- [ ] Use `navigator.mediaDevices.getUserMedia` only after user interaction; request rear camera `facingMode: environment` where supported.
- [ ] Check torch capability before requesting flash; show fallback when unavailable (never assume flash works on all phones).
- [ ] Build states `unsupported`, `permission_denied`, `ready`, `capturing`, `analyzing`, `poor_signal`, `success`, `canceled`, `error`.
- [ ] Display BPM, collection timestamp, signal-quality status, measurement limitations; avoid mock numeric placeholders in actual result view.
- [ ] Provide visible cancel button and accessible non-camera exit route; explain that lighting, motion and camera quality affect result.

## 4. Task checklist - API / state / Supabase integration

- [ ] Implement browser-only capture component; use video/canvas safely, sample approved red-channel intensity + accurate timestamps to a bounded in-memory buffer; preserve capture cadence metadata.
- [ ] Agree sample rate, time window, payload size, timestamps, artifact handling and signal-quality contract with AI Engineer **before** sending data.
- [ ] Call authenticated `POST /api/ppg/analyze` through Next.js, with server-side validation, request size guard and timeout.
- [ ] Validate response: only `quality=acceptable` and actual valid BPM measurement may reach success state.
- [ ] Store a minimal PPG session with BPM, quality/source/time only if user explicitly saves or agreed auto-save consent exists.
- [ ] Use browser MediaStreamTrack stop on success, error, cancel, navigation, visibility loss and unmount; clear transient samples promptly.
- [ ] Add `AbortController` and ignore late responses after cancellation.

## 5. Data and contract notes

- `ppg_sessions`: user_id, measured_at, bpm (nullable on failed measurements), quality_status, device_context if consented, algorithm_version.
- Never persist camera frames, video files or raw optical waveforms by default.
- If quality is poor, record failure reason only when justified and consented, not a fake BPM.

## 6. Safety, privacy and authorization checks

- [ ] Camera activation always explicit and visually identifiable.
- [ ] Never call it pressure/blood oxygen/AF/stroke detection; F03 output cannot enter F01 WHO risk calculation.
- [ ] HTTPS (or localhost) required, limited memory buffer, tracks stopped and cross-user session data inaccessible.

## 7. Required tests / demo scenarios

- [ ] Actual phone: camera available + torch supported; capture -> validated BPM against a reference pulse device, labeled as demo/unvalidated.
- [ ] Actual phone without torch capability and device without rear camera.
- [ ] Permission denied and interruption mid-capture cleanly stop tracks.
- [ ] Noisy/short/poor quality signal shows retry, **no BPM**.
- [ ] API timeout, malformed BPM, canceled request, unmount and route change release camera.
- [ ] Session save/query is user-scoped; no raw frames written to storage/logs.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] Browser capture is consented, cancellable and cleans all camera resources.
- [ ] Valid BPM is displayed only after passing the AI Engineer quality gate.
- [ ] No BP, AF, arrhythmia or stroke prediction language anywhere in F03.
- [ ] Denied/no camera/poor signal paths have understandable fallbacks.
- [ ] Phone validation against reference is documented as a prototype test, not clinical validation.

## 9. Explicitly out of scope

- Creating a new ML model for BPM.
- Claiming camera-based blood pressure estimation or AF screening.
- Keeping raw video recordings or feeding BPM into WHO risk charts.

## 10. External decisions / blockers

- AI Engineer sample format, digital signal processing, quality threshold and validation vectors.
- Supported-device test plan and explicit camera-use privacy copy.

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
