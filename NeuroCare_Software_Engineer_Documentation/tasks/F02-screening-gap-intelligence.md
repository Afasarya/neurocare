# F02 - Screening Gap Intelligence

> **Point:** A - NeuroPrevent  
> **Priority:** P0 / MVP  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** F01 form/session data; F08 health measurements and actions; AI Engineer deterministic gap rules.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Show which relevant health information/checkups are missing or outdated and turn reviewed follow-ups into actionable checklist items, without hallucinated clinical scores.

## 2. User stories

- Saya tahu apakah tekanan darah, waktu pemeriksaan terakhir, atau data faktor risiko saya belum tersedia.
- Saya dapat melihat prioritas follow-up yang sudah disepakati tim medis dan menambahkannya ke rencana tindakan.
- Saya dapat memperbarui pemeriksaan dan memahami kapan gap berubah menjadi selesai.

## 3. Task checklist - UI / frontend

- [ ] Build `src/features/screening-gaps` gap list/card components and `/app/screening/gaps` page.
- [ ] Show human-readable categories: unknown measurement, checkup due according to approved rule, possible follow-up and completed/cleared.
- [ ] Display `Kenapa disarankan?` and supporting recorded fact/date when available; never confuse missing data with abnormal medical result.
- [ ] Allow `Catat hasil pemeriksaan`, `Lihat riwayat`, and `Tambah ke Rencana` CTAs linked to F08.
- [ ] Show empty (`belum ada assessment`), completed (`tidak ada gap berdasarkan data saat ini`), pending and error states.
- [ ] Ensure disclaimers about non-diagnostic checklists and mobile-friendly progress.

## 4. Task checklist - API / state / Supabase integration

- [ ] Agree a typed deterministic `gap[]` payload with the AI Engineer: id, type, related_measurement, status, reason, source, next_action and confidence/applicability state (not inferred by UI).
- [ ] Use actual F01 sessions and F08 historical measurements as input; do not fabricate BP, visit dates or thresholds.
- [ ] Implement read endpoint/service for gaps behind authentication, with server-side Zod validation.
- [ ] Use TanStack Query cache keys scoped to current user and invalidation after saving a measurement or checklist item.
- [ ] Map approved gap action IDs to F08 `action_items`; guard duplicate action creation.
- [ ] If rules service missing, show transparent unavailable state or non-clinical static educational guidance, not a made-up personalized verdict.

## 5. Data and contract notes

- `screening_gaps` as versioned derived snapshot or server-side derived response; choose with team and document.
- Action-item FK or stable action identifier, timestamps and rule source/version.
- No clinical threshold hardcoded in React components.

## 6. Safety, privacy and authorization checks

- [ ] Personal screening gaps scoped to logged-in owner.
- [ ] Missing BP is **unknown**, not high or normal BP; no inferred health values.
- [ ] The source/last-checked timestamp must be evident; old results should be marked stale when rules require recalculation.

## 7. Required tests / demo scenarios

- [ ] Unknown BP produces a missing-measurement card according to approved fixture.
- [ ] New measurement invalidates/recomputes visible gap without duplicate checklist item.
- [ ] No prior screening renders an understandable empty state.
- [ ] Rule-engine unavailable does not create personalized medical guidance.
- [ ] Cross-user access denied and rapid clicks do not duplicate actions.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] All gap cards have traceable underlying input or AI Engineer-provided deterministic rule source.
- [ ] User can navigate to add missing measurement and action plan without losing context.
- [ ] Missing, completed, unavailable and empty states work.
- [ ] No LLM-only gap or clinical threshold invention.
- [ ] Authorization, invalidation and critical tests pass.

## 9. Explicitly out of scope

- Reinventing Kemenkes/WHO medical screening intervals.
- LLM-as-primary-rule-engine.
- A risk percentage from incomplete data.

## 10. External decisions / blockers

- Deterministic gap schema, rule version and reviewed thresholds/periods.
- Decision whether gaps are stored snapshots or server-derived.

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
