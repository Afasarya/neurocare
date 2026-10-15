# F08 - Health Timeline & Preventive Action Planner

> **Point:** C - Cross-pathway shared foundation  
> **Priority:** P0 / MVP (foundational)  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** Supabase project/env, Auth, SSR cookie/session setup; reviewed privacy policy and minimal schema.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Provide a secure shared record of checkups, screenings, rehabilitation sessions and follow-up action items across both pathways, forming the data foundation for the other P0 features.

## 2. User stories

- Saya dapat menambahkan pengukuran kesehatan dengan tanggal dan satuan yang jelas.
- Saya dapat melihat urutan kejadian (screening, pengukuran, check-in, aktivitas) milik saya sendiri.
- Saya dapat menandai aksi tindak lanjut `belum dikerjakan`/`selesai` dan melihat riwayatnya.
- Informasi NeuroPrevent dan NeuroRecovery hanya ditampilkan sesuai jalur saya, tanpa akses data orang lain.

## 3. Task checklist - UI / frontend

- [ ] Create `/app/timeline` with chronological event list, event type tabs/filters, date, details, empty/loading/error states.
- [ ] Create `/app/action-plan` with pending/completed action items, sources, due-date where approved and completion toggles.
- [ ] Create accessible health measurement entry UI (BP systolic/diastolic, weight, height as agreed) with units, measured-at date, edit/history, user-reported source.
- [ ] Add dashboard widgets `pengukuran terakhir`, `aktivitas terbaru`, `rencana selanjutnya` with no fake data.
- [ ] Use useful action CTAs from F02 gaps and F05/F07 recovery flow; prevent duplicate items.
- [ ] Show `last updated` and preserve original measurement timestamps; no diagnosis from raw numbers.
- [ ] Provide clear privacy and delete/export policy entry points in profile per team policy.

## 4. Task checklist - API / state / Supabase integration

- [ ] Agree SQL schema for `profiles`, `consents`, `health_measurements`, `action_items` and other referenced entities with the team.
- [ ] Write migration files with FK to `auth.users`, appropriate constraints, indexes and timestamp defaults; create RLS policies **together** with tables.
- [ ] Implement Supabase browser/server clients and session refresh (`proxy.ts` Next.js 16; inspect actual version).
- [ ] Create authenticated CRUD Route Handlers or server functions for measurements, timeline query and action items; Zod-validate every write.
- [ ] Use server-derived `auth.uid()` and RLS, verify access with two independent test user accounts.
- [ ] Build unified timeline via a typed aggregator/query of underlying records; avoid duplicating full health payloads into timeline rows by default.
- [ ] Use TanStack Query with owner-specific keys, invalidation after writes, and private request no-store as appropriate.
- [ ] Provide migration instructions and `.env.example` with names only; never modify real `.env.local` credentials.

## 5. Data and contract notes

- Core: `profiles`, `consents`, `health_measurements`, `action_items` (with `user_id`, timestamps, policy version/source, units/status).
- F01/F05/F06/F03 source tables join/aggregate into timeline once those features exist.
- Check constraints: allowed statuses, positive reasonable measurements from approved input validation, UTC timestamps, unique action dedupe key if needed.
- Design retention, soft delete versus physical deletion, export and cascade behavior with explicit team policy.

## 6. Safety, privacy and authorization checks

- [ ] RLS on every user-owned table; verify SELECT/INSERT/UPDATE/DELETE scoped to authenticated owner.
- [ ] Never use service role key in public client or bypass RLS for convenience.
- [ ] No public caching of private timeline; no PHI in localStorage, analytics or app logs.
- [ ] User cannot change ownership field after creation or write another user id.

## 7. Required tests / demo scenarios

- [ ] Authenticated User A creates measurement and sees it in their timeline with correct units/date.
- [ ] User B cannot SELECT/UPDATE/DELETE User A measurements/actions (RLS and route check).
- [ ] Bad units, impossible date and malformed request are rejected with safe errors.
- [ ] Completing action persists once and updates the visible list and dashboard.
- [ ] Blank account has healthy empty state; correct sorting over midnight/time zones.
- [ ] Unauthenticated API requests fail; auth refresh works after reload; no private cache offline.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] Core schema migrations and restrictive per-user RLS exist and pass isolation tests.
- [ ] Measurements, timeline and action items are functional and private.
- [ ] All timestamps, units and sources are explicit and reliable.
- [ ] Dashboard can consume actual secure timeline/action data.
- [ ] No secrets/PHI in bundled source, local storage, logs or offline cache.
- [ ] Typed CRUD APIs and migration setup are documented.

## 9. Explicitly out of scope

- Implementing a full electronic health record.
- Automatic medical interpretation of BP thresholds.
- Public caregiver access by default.

## 10. External decisions / blockers

- Approved minimal schema and user consent/retention policy.
- Agreement on exact measurements and validation ranges; RLS review.

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
