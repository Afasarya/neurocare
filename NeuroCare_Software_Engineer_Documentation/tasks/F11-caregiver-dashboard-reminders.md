# F11 - Caregiver Dashboard & Reminders

> **Point:** Backlog - cross-pathway extension  
> **Priority:** P2 / Backlog only  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** BLOCKED / feature-flagged safe prototype
> **Dependencies:** P0 RLS maturity; explicit user sharing model; team approval; verified delivery channel and consent wording.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Document optional caregiver participation and follow-up reminders while preserving the primary user's control over sensitive health data. Do not implement default broad sharing.

## 2. User stories

- Sebagai pengguna, saya kelak dapat secara sadar memilih apakah caregiver tertentu boleh melihat ringkasan terbatas.
- Saya dapat mencabut akses kapan saja dan mengetahui data apa yang akan dibagikan.
- Saya dapat mengatur pengingat pemeriksaan/check-in tanpa mengungkap diagnosis atau isi data ke pihak lain.

## 3. Task checklist - UI / frontend

- [x] [BACKLOG] Draft user-driven invitation, permission summary and revocation flow (not exposed in MVP).
- [ ] [BACKLOG] Design caregiver view as limited read-only summaries only after approved policy; clearly show whose data and why it is shared.
- [x] [BACKLOG] Design reminder preferences (type, time, channel, quiet hours, opt-out) with non-alarming generic copy.
- [x] [BACKLOG] Show no caregiver data until consent and authorization are verified server-side.

## 4. Task checklist - API / state / Supabase integration

- [x] [BACKLOG] Define explicit ACL join table (`caregiver_access`) for inviting user, recipient, scope, accepted_at, revoked_at; do not grant based on email string alone.
- [ ] [BACKLOG] Plan per-record authorization checks and RLS on caregiver association and permitted views, test revoke immediately.
- [ ] [BACKLOG] Identify approved notification provider/scheduler; no assumption PWA background push works on every device.
- [x] [BACKLOG] Decide whether reminder channel can expose any sensitive details; prefer generic notification text.
- [ ] [BACKLOG] Integrate with F08 `action_items` only after permissions/security review.

## 5. Data and contract notes

- Potential future `caregiver_access`, `reminder_preferences`, `reminder_deliveries`; no default migration until approved.
- Proposed `caregiver_access`: immutable invitation ID, inviting owner derived from authenticated server context, verified recipient user ID only after acceptance, allowlisted scope, policy version, `invited_at`, `accepted_at`, `revoked_at`, and audit metadata. An email address is an invitation destination only and never an authorization key.
- Proposed authorization: default deny; owner may create/revoke their association; recipient may see only their own accepted, non-revoked association; every shared record/view must re-check active scope and ownership. Revocation must invalidate access immediately and produce an audit event. This plan is not implemented or RLS-tested yet.
- Proposed reminders store owner-only preference metadata and generic delivery status. Notification payload is fixed to `Anda memiliki pengingat NeuroCare.` and must not contain diagnosis, measurement, result, action title, or recovery detail.
- Draft contracts use `f11-draft-v1`. Development responses are `simulated`; no invitation, permission, reminder schedule, or delivery is actually created.

## 6. Safety, privacy and authorization checks

- [x] Sharing defaults OFF; principle of least privilege and explicit revoke.
- [x] No sharing of raw screening/rehab information by simply knowing another user ID.
- [x] Notifications never include private health details in push/email preview without explicit policy.

## 7. Required tests / demo scenarios

- [x] Disabled feature does not create permissions or access paths.
- [ ] If implemented: unauthorized caregiver gets 403/RLS deny.
- [ ] If implemented: revocation instantly removes API access.
- [ ] If implemented: quiet hours, opt-out and delivery failures handled.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [x] No caregiver access exists without explicit verified authorization.
- [x] Task remains P2 until security and consent model approved.
- [ ] If activated later, RLS, revocation, audit trail and reminder reliability tests pass.

## 9. Explicitly out of scope

- Building a clinical multi-tenant hospital dashboard in hackathon MVP.
- Selling/sharing user health data by default.
- Implementing reminders without channel delivery infrastructure.

## 10. External decisions / blockers

- Team-approved caregiver scope and consent/data-sharing policy.
- Delivery provider and schedule strategy, security review and P2 activation.

## 11. Feature delivery report (agent fills after implementation)

- **Status:** BLOCKED — feature-flagged safe prototype; no caregiver data access or real reminder delivery exists
- **PR / commit:** local working tree only; no commit created
- **Files added or changed:** `src/features/caregiver/**`, `src/app/app/caregiver/page.tsx`, `src/app/api/caregiver/**`, app navigation, `.env.example`, and this task file
- **Schema migrations:** none; ACL, audit, reminder and delivery schemas require approved policy plus real RLS/revocation tests
- **API contract / fixture reference:** `f11-draft-v1`; development header `X-NeuroCare-Caregiver-Demo: caregiver-fixture-v1`; all successful development responses are explicitly `simulated`
- **Commands/tests actually run:** initial `npx tsc --noEmit` passed; initial `npm run lint` had one unused-import warning that was removed; initial `npm test -- --run` passed (17 files, 118 tests); `npm run build` passed on Next.js 16.4.1; disabled HTTP smoke checks returned page/both APIs 404 with no navigation item and private no-store headers; enabled production APIs returned 401 without authentication; enabled navigation and simulated invite/revoke/reminder behavior are covered by unit tests. Final lint/typecheck/tests were rerun after cleanup.
- **Manual device/accessibility/security checks:** semantic form controls, large targets, visible focus utility, live/error states, explicit revoke confirmation, masked recipient display, generic notification preview and opt-out UI implemented; physical device and screen-reader checks remain pending
- **Known limitations / follow-up:** route/navigation are disabled unless `FEATURE_F11_CAREGIVER_REMINDERS=true`; no real invitation, identity verification, caregiver view, provider, scheduler, persistence, F08 integration, audit trail, ACL or RLS; policy/provider/security/accessibility approvals remain required

> **Task discipline:** Check boxes only after verification. P2 tasks remain backlog unless the human Software Engineer explicitly activates them. For all tasks, the universal Definition of Done in `PROJECT_CONTEXT.md` and `AGENTS.md` also applies.
