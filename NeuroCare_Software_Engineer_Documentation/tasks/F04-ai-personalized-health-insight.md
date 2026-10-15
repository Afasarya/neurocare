# F04 - AI Personalized Health Insight

> **Point:** A - NeuroPrevent (reusable shared capability)  
> **Priority:** P0 / MVP  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** IN PROGRESS / guarded insight shell implemented; AI contract and privacy approval pending
> **Dependencies:** F01 validated deterministic findings; F02 gaps; user consent; AI Engineer structured LLM endpoint.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Present readable, bounded, non-diagnostic explanations of approved screening findings and next steps, with robust failure fallback that never manufactures individual medical conclusions.

## 2. User stories

- Saya dapat membaca penjelasan bahasa Indonesia tentang hasil screening yang valid dan pemeriksaan yang masih kurang.
- Saya tahu mana informasi dari pengukuran/rules engine dan mana ringkasan yang ditulis AI.
- Ketika AI tidak tersedia, data screening tetap terlihat dan aplikasi memberi langkah non-diagnostik yang aman.

## 3. Task checklist - UI / frontend

- [ ] Create `src/features/insights` card and `/app/insights` view; keep insight linked to one verified session/source.
- [x] Show `Penjelasan berbantuan AI`, source timestamp and clear non-medical advice disclaimer.
- [x] Render structured sections: `ringkasan`, `faktor yang tercatat`, `data yang belum lengkap`, `tindakan lanjutan umum`, and `keterbatasan` where approved.
- [x] Use explicit `Generate insight`/consent UX and optional regenerate button with loading/rate limits.
- [x] Show an emergency warning before insight UI if safety status is positive; do not generate routine text.
- [x] Provide accessible retry and safe deterministic/template fallback; never show raw model JSON or prompt.

## 4. Task checklist - API / state / Supabase integration

- [ ] Agree `POST /api/ai/health-insight` structured request/response with AI Engineer, including a stable schemaVersion and permitted sections.
- [x] Send only necessary approved deterministic finding fields, excluding names/contact info and any unnecessary health details.
- [x] Proxy provider requests server-side; credentials in server environment only; schema-validate AI response.
- [x] Reject any response containing missing required sections, unsolicited numbers/risk values or disallowed fields per policy; retain deterministic UI and show fallback.
- [x] Prevent duplicate generation via pending UI state and server rate limits/quotas.
- [x] Keep insight references to screening session and track whether response was generated or template; avoid silent replacement of facts.

## 5. Data and contract notes

- Optional `insight_records` with owner, source screening session ID, model/schema version, generated_at and appropriately minimized text; confirm retention before storing.
- Never store provider secrets, raw prompts with identifiers or unnecessarily long clinical conversation logs.

## 6. Safety, privacy and authorization checks

- [x] LLM text cannot override emergency status or WHO CVD risk value/eligibility.
- [ ] Medical data sharing consent must be specifically approved; do not send data to external LLM merely because user logged in.
- [x] If consent is absent: no LLM call; show a non-personalized explanatory template.
- [x] No diagnosis, prescribed medication, or claim to replace a clinician.

## 7. Required tests / demo scenarios

- [x] Approved structured AI response shows labeled text without altering deterministic metrics.
- [x] Invalid JSON, empty model output, 429 and timeout trigger safe fallback.
- [x] AI says a conflicting risk percentage: reject or suppress conflict; original deterministic result unchanged.
- [x] No LLM call on emergency status or without consent.
- [ ] Network and API logs do not contain provider key or unnecessary identity fields.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [x] Insight UX clearly distinguishes AI interpretation and validated data.
- [x] UI works even with AI down, showing no fabricated medical insights.
- [x] Consent gate and minimal data transfer are implemented.
- [x] Risk/emergency facts cannot be mutated by the model.
- [ ] AI contract, response validation and tests cover malformed/harmful responses.

## 9. Explicitly out of scope

- Building a clinical diagnostic chatbot.
- Generating risk percentages, doses or rehabilitation prescriptions.
- Exposing provider API key to the browser.

## 10. External decisions / blockers

- AI Engineer structured schema and safety policy, reviewed prompts and fixtures.
- Approval for data sent to the LLM provider and associated privacy language.

## 11. Feature delivery report (agent fills after implementation)

- **Status:** IN PROGRESS — safe UI/API boundary is implemented; real-source session loading, approved AI schema/prompt/privacy copy and durable rate limiting remain pending.
- **PR / commit:** Working tree implementation; no commit created by this agent.
- **Files added or changed:** `src/app/app/insights/page.tsx`, `src/app/api/ai/health-insight/route.ts`, `src/features/insights/**`, `.env.example`, `.gitignore`, and app navigation in `src/app/app/layout.tsx`.
- **Schema migrations:** _none yet_
- **API contract / fixture reference:** Proposed strict schema `health-insight-v1` in `health-insight.contract.ts`; labeled development fixtures `approved` and `unavailable`. Production forwarding is fail-closed unless the approved schema-version environment gate matches.
- **Commands/tests actually run:** `npx tsc --noEmit`; `npm run lint`; `npm test` (39 passed); `npm run build`; HTTP smoke check (`/app/insights` 200, approved demo `ok`, no-consent `template`, emergency `emergency_blocked`, malformed payload 400, oversized payload 413).
- **Manual device/accessibility/security checks:** Keyboard-sized controls, labels, ARIA live/status regions and no-store responses reviewed in code. Automated browser/assistive-technology and two-user Supabase isolation checks were not run.
- **Known limitations / follow-up:** Current screen uses a labeled synthetic source because F01/F02 persistence/session selection is not complete. Obtain AI Engineer contract and privacy wording approval, connect an authenticated real screening session, use durable distributed quotas, decide retention before adding `insight_records`, and run two-user isolation plus browser accessibility tests.

> **Task discipline:** Check boxes only after verification. P2 tasks remain backlog unless the human Software Engineer explicitly activates them. For all tasks, the universal Definition of Done in `PROJECT_CONTEXT.md` and `AGENTS.md` also applies.
