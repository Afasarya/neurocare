# Supabase migrations and RLS verification

These migrations are additive and are committed only. They have **not** been
applied to any Supabase project by this repository or by the application.

## Migration order

Apply the files once, in their filename order:

1. `supabase/migrations/202610160001_profiles_consents.sql` — user profile and
   immutable, append-only consent events.
2. `supabase/migrations/202610160002_health_measurements_action_items.sql` —
   F08 measurements and action status, including operation idempotency and a
   trigger that prevents browser-side mutation of derived action content.
3. `supabase/migrations/202610160003_screening_sessions_gaps.sql` — F01/F02
   screening snapshots and deterministic gap records.
4. `supabase/migrations/202610160004_recovery_checkins_activities.sql` — F05/F07
   self-report check-ins and validated recovery activity summaries.
5. `supabase/migrations/202610160005_insight_records.sql` — F04 validated
   AI/template insight records.

Every health-data table has a `user_id` foreign key to `auth.users(id)` with
`ON DELETE CASCADE`; child facts also use composite foreign keys where a parent
record must belong to the same user. Account deletion must use the product's
separate confirmed account-deletion process, not an ad-hoc SQL deletion.

## Apply safely

1. In Supabase, create a backup and apply the files to a staging project first.
2. Confirm the project URL and environment before linking. Do not put a
   service-role key in `.env.local`, browser code, or this repository.
3. Install/authenticate the Supabase CLI, link **the intended staging project**,
   then apply the committed migrations:

   ```powershell
   npx supabase@latest login
   npx supabase@latest link --project-ref <your-staging-project-ref>
   npx supabase@latest db push
   ```

   Alternatively, paste each file into the Supabase SQL Editor in the exact
   order above, once only. Do not re-run a migration after it has succeeded.

4. Generate type definitions from the applied schema and review the diff:

   ```powershell
   npx supabase@latest gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
   npm run lint
   npx tsc --noEmit
   npm test
   ```

5. Deploy the same migration history to production only after the verification
   below passes in staging. There is intentionally no destructive rollback SQL.

## RLS policy model

All tables enable RLS. An authenticated user may select only rows where
`user_id = auth.uid()`.

- `profiles`, `health_measurements`, and `recovery_checkins` permit owner CRUD.
- `consents` permits owner select/insert only. A withdrawal is a new event;
  no consent row can be edited or deleted by the user role.
- `action_items` permits owner reads and status updates. Its trigger makes
  derived source fields/content immutable to browser users. A user-created
  follow-up may be inserted only with `source_kind = 'user_created'`.
- `screening_sessions`, `screening_gaps`, `recovery_activities`, and
  `insight_records` are read-only to the browser role. A validated backend
  integration writes derived rows using a server-only privileged credential or
  an equally restricted backend path—never a frontend key.

The AI endpoint checks the latest `external_ai` consent event before provider
execution. A `withdrawn` event, a missing event, or a consent-store error all
fail closed and return a safe template instead of calling an AI provider.

## Test with two real accounts

Use two of the existing non-production Supabase accounts. Add only these local
test values to `.env.local` (do not commit the file):

```dotenv
RLS_TEST_USER_A_EMAIL=...
RLS_TEST_USER_A_PASSWORD=...
RLS_TEST_USER_B_EMAIL=...
RLS_TEST_USER_B_PASSWORD=...
```

Then run:

```powershell
npm run test:rls
```

The test authenticates both users using the publishable key; it creates a
synthetic measurement and user-created action for account A, verifies that B
cannot read/update/delete them, verifies A can persist an action completion,
and removes its synthetic rows even if a check fails. A pass is the required
evidence before marking RLS verified.

## Manual F08 persistence acceptance check

After RLS passes, sign in with account A and leave
`NEXT_PUBLIC_NEUROCARE_DEMO_MODE` unset/`false`.

1. Add a measurement at `/app/timeline`.
2. Refresh the page and sign out/in again; the measurement must remain.
3. Use `/app/actions` to change a stored action's status; refresh and confirm
   its status and completion time remain.
4. Sign in as account B. Account A's measurement/action must not appear.

F08 uses the authenticated server Supabase client and derives `user_id` from
`auth.getUser()`; it does not accept a user ID from a browser request.
