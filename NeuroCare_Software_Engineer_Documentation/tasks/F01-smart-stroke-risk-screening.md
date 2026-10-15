# F01 - Smart Stroke Risk Screening

> **Point:** A - NeuroPrevent  
> **Priority:** P0 / MVP  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** Auth/onboarding; profile pathway; safety gate contract; F08 persistence; AI Engineer screening contract.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

User fills a valid screening questionnaire, receives an eligibility-aware deterministic result from the approved clinical engine, and can revisit a correctly labeled history. UI is not a diagnostic tool.

## 2. User stories

- Sebagai pengguna NeuroPrevent berusia 40-59 tahun, saya dapat mengisi data yang diperlukan untuk menerima kategori estimasi **risiko CVD gabungan 10 tahun** yang benar-benar berasal dari engine WHO terverifikasi.
- Sebagai pengguna usia 18-39 tahun, saya melihat penjelasan faktor risiko dan pemeriksaan yang belum dilakukan **tanpa angka WHO**.
- Sebagai pengguna dengan riwayat stroke/TIA/CVD, saya tidak diberi WHO primary-prevention score dan diarahkan ke alur yang lebih sesuai.
- Sebagai pengguna yang menunjukkan gejala mendadak, saya melihat instruksi bantuan darurat tanpa harus menunggu AI.

## 3. Task checklist - UI / frontend

- [ ] Create `/app/screening` step flow: pre-screening limitations + emergency notice, eligibility, questionnaire, review, status/result.
- [ ] Provide accessible labeled inputs for age/date of birth, sex category required by approved chart, smoking, measured systolic BP and its date, height/weight or BMI inputs according to approved non-lab schema; distinguish unknown from missing/invalid.
- [ ] Implement emergency-gate UI before routine flow with reviewed content; when positive, stop the assessment and show emergency help screen.
- [ ] Explain that result (when eligible) represents **10-year combined cardiovascular event risk**, not individual stroke probability.
- [ ] Create `/app/screening/history` for dated prior results with a non-medical status and source label.
- [ ] Show `eligibility unknown`, `not eligible`, `insufficient data`, `calculating`, `success`, `service unavailable`, `emergency` distinctly.
- [ ] Use responsive wizard/progress controls, save/return affordance only if data privacy and persistence are explicitly designed.

## 4. Task checklist - API / state / Supabase integration

- [ ] Create client Zod schema and separate server-side Zod schema; validate units, required fields and explicit unknown values without inventing clinical thresholds.
- [ ] Agree `POST /api/screening/analyze` request/response with AI Engineer, including medical status union, CVD result semantics, data source and version.
- [ ] Authenticate Route Handler, derive user from server session; do not trust submitted owner ID.
- [ ] Call AI Engineer clinical/rules service using server-only adapter, timeout and response schema; never implement WHO lookup in UI.
- [ ] Persist screening record with timestamp, eligibility/status, minimal validated inputs, source/version and user ownership (subject to reviewed retention policy).
- [ ] Send validated session result to F02/F04 views via a stable record ID/adapter; avoid recalculating from LLM text.
- [ ] Apply rate/payload limits; no health fields in console or provider error logs.

## 5. Data and contract notes

- `screening_sessions` with user ownership, completed_at, result_status, risk_scope=`cvd_10y` where applicable, source and engine version.
- Input measurements reference `health_measurements` if already stored; if snapshot is needed, minimize duplication.
- No fabricated risk score, e.g. no hardcoded `low = 5%`; display only validated result labels or categories supplied by AI Engineer.

## 6. Safety, privacy and authorization checks

- [ ] Previous stroke/TIA/CVD and ages 18-39 must not get primary-prevention WHO numeric results.
- [ ] Triage UX must take precedence over calculations/insight generation.
- [ ] RLS read/write only the owner; cross-user access check required.
- [ ] Never store draft sensitive answers in localStorage or PWA offline caches.

## 7. Required tests / demo scenarios

- [ ] 18-39 returns gap-oriented state and zero WHO score fields.
- [ ] 40-59 with complete eligible fixture displays source-verified CVD category, never stroke probability.
- [ ] Previous stroke/TIA/CVD fixture shows not-eligible state.
- [ ] Missing BP, invalid unit, malformed data and AI timeout return no invented result.
- [ ] Emergency flag prevents regular submission and displays urgent help.
- [ ] User B cannot access User A screening history; repeated submission does not create accidental duplicates.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] End-to-end screening can be completed on mobile with keyboard-accessible fields.
- [ ] Every result is correctly labeled CVD (10-year), with timestamp/source and limitations.
- [ ] Ineligible, insufficient, unavailable and emergency flows are visibly distinct.
- [ ] No medical numeric result is computed or generated in Software Engineer code.
- [ ] Secure, authorized history is readable only by its owner.
- [ ] Server and client input/output validation, test fixtures and tests are committed.

## 9. Explicitly out of scope

- Clinical WHO table lookup, emergency symptom decision thresholds and interpretation (AI Engineer/medical reviewer).
- Using an LLM to generate or change risk scores.
- Claims of stroke diagnosis or future stroke prediction.

## 10. External decisions / blockers

- Approved emergency questionnaire and eligibility rule contract.
- WHO Southeast Asia lookup implementation, test vectors, payload schema/version.
- Clinically reviewed text for result categories/limitations.

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
