# F11 - Caregiver Dashboard & Reminders

> **Point:** Backlog - cross-pathway extension  
> **Priority:** P2 / Backlog only  
> **Owner:** Software Engineer (Next.js PWA, Supabase, integration)  
> **Status:** TODO / not started  
> **Dependencies:** P0 RLS maturity; explicit user sharing model; team approval; verified delivery channel and consent wording.

[Back to Project Context](../PROJECT_CONTEXT.md) | [AI Agent Rules](../AGENTS.md)

## 1. Objective

Document optional caregiver participation and follow-up reminders while preserving the primary user's control over sensitive health data. Do not implement default broad sharing.

## 2. User stories

- Sebagai pengguna, saya kelak dapat secara sadar memilih apakah caregiver tertentu boleh melihat ringkasan terbatas.
- Saya dapat mencabut akses kapan saja dan mengetahui data apa yang akan dibagikan.
- Saya dapat mengatur pengingat pemeriksaan/check-in tanpa mengungkap diagnosis atau isi data ke pihak lain.

## 3. Task checklist - UI / frontend

- [ ] [BACKLOG] Draft user-driven invitation, permission summary and revocation flow (not exposed in MVP).
- [ ] [BACKLOG] Design caregiver view as limited read-only summaries only after approved policy; clearly show whose data and why it is shared.
- [ ] [BACKLOG] Design reminder preferences (type, time, channel, quiet hours, opt-out) with non-alarming generic copy.
- [ ] [BACKLOG] Show no caregiver data until consent and authorization are verified server-side.

## 4. Task checklist - API / state / Supabase integration

- [ ] [BACKLOG] Define explicit ACL join table (`caregiver_access`) for inviting user, recipient, scope, accepted_at, revoked_at; do not grant based on email string alone.
- [ ] [BACKLOG] Plan per-record authorization checks and RLS on caregiver association and permitted views, test revoke immediately.
- [ ] [BACKLOG] Identify approved notification provider/scheduler; no assumption PWA background push works on every device.
- [ ] [BACKLOG] Decide whether reminder channel can expose any sensitive details; prefer generic notification text.
- [ ] [BACKLOG] Integrate with F08 `action_items` only after permissions/security review.

## 5. Data and contract notes

- Potential future `caregiver_access`, `reminder_preferences`, `reminder_deliveries`; no default migration until approved.

## 6. Safety, privacy and authorization checks

- [ ] Sharing defaults OFF; principle of least privilege and explicit revoke.
- [ ] No sharing of raw screening/rehab information by simply knowing another user ID.
- [ ] Notifications never include private health details in push/email preview without explicit policy.

## 7. Required tests / demo scenarios

- [ ] Disabled feature does not create permissions or access paths.
- [ ] If implemented: unauthorized caregiver gets 403/RLS deny.
- [ ] If implemented: revocation instantly removes API access.
- [ ] If implemented: quiet hours, opt-out and delivery failures handled.

## 8. Acceptance criteria (feature can be marked DONE only when these pass)

- [ ] No caregiver access exists without explicit verified authorization.
- [ ] Task remains P2 until security and consent model approved.
- [ ] If activated later, RLS, revocation, audit trail and reminder reliability tests pass.

## 9. Explicitly out of scope

- Building a clinical multi-tenant hospital dashboard in hackathon MVP.
- Selling/sharing user health data by default.
- Implementing reminders without channel delivery infrastructure.

## 10. External decisions / blockers

- Team-approved caregiver scope and consent/data-sharing policy.
- Delivery provider and schedule strategy, security review and P2 activation.

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
