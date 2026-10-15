/**
 * Live integration verification for owner-based RLS. This uses only the
 * publishable key and two existing test accounts; it never creates accounts
 * and removes the synthetic rows it creates.
 *
 * Run after migrations: npm run test:rls
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "RLS_TEST_USER_A_EMAIL",
  "RLS_TEST_USER_A_PASSWORD",
  "RLS_TEST_USER_B_EMAIL",
  "RLS_TEST_USER_B_PASSWORD",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const a = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const b = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`${label} sign-in failed: ${error?.message ?? "no user"}`);
  return data.user;
}

async function expectNoError(result, label) {
  if (result.error) throw new Error(`${label} failed: ${result.error.message} (${result.error.code ?? "no-code"})`);
  return result.data;
}

const cleanup = { measurementId: null, actionId: null };

try {
  const userA = await signIn(a, process.env.RLS_TEST_USER_A_EMAIL, process.env.RLS_TEST_USER_A_PASSWORD, "User A");
  const userB = await signIn(b, process.env.RLS_TEST_USER_B_EMAIL, process.env.RLS_TEST_USER_B_PASSWORD, "User B");
  if (userA.id === userB.id) throw new Error("RLS test accounts must be two distinct users.");

  const measurement = await expectNoError(
    a.from("health_measurements")
      .insert({
        user_id: userA.id,
        operation_id: randomUUID(),
        measurement_type: "weight",
        value: 61.25,
        secondary_value: null,
        unit: "kg",
        source: "user_reported",
        measured_at: new Date().toISOString(),
      })
      .select("id, user_id")
      .single(),
    "User A creates a measurement",
  );
  cleanup.measurementId = measurement.id;

  const ownMeasurement = await expectNoError(
    a.from("health_measurements").select("id").eq("id", measurement.id),
    "User A reads own measurement",
  );
  if (ownMeasurement.length !== 1) throw new Error("User A could not read its own measurement.");

  const crossMeasurementRead = await expectNoError(
    b.from("health_measurements").select("id").eq("id", measurement.id),
    "User B cross-user measurement read check",
  );
  if (crossMeasurementRead.length !== 0) throw new Error("RLS leak: User B read User A measurement.");

  const crossMeasurementUpdate = await expectNoError(
    b.from("health_measurements").update({ value: 99 }).eq("id", measurement.id).select("id"),
    "User B cross-user measurement update check",
  );
  if (crossMeasurementUpdate.length !== 0) throw new Error("RLS leak: User B updated User A measurement.");

  const action = await expectNoError(
    a.from("action_items")
      .insert({
        user_id: userA.id,
        dedupe_key: `rls-test-${randomUUID()}`,
        title: "Synthetic RLS test action",
        description: "Created and removed by the automated RLS verification.",
        pathway: "shared",
        source_kind: "user_created",
        source_label: "RLS verification",
      })
      .select("id, user_id, status")
      .single(),
    "User A creates own action",
  );
  cleanup.actionId = action.id;

  const ownActionUpdate = await expectNoError(
    a.from("action_items").update({ status: "completed" }).eq("id", action.id).select("id, status, completed_at").single(),
    "User A completes own action",
  );
  if (ownActionUpdate.status !== "completed" || !ownActionUpdate.completed_at) {
    throw new Error("Database did not persist User A action completion.");
  }

  const crossActionRead = await expectNoError(
    b.from("action_items").select("id").eq("id", action.id),
    "User B cross-user action read check",
  );
  if (crossActionRead.length !== 0) throw new Error("RLS leak: User B read User A action.");

  const crossActionDelete = await expectNoError(
    b.from("action_items").delete().eq("id", action.id).select("id"),
    "User B cross-user action delete check",
  );
  if (crossActionDelete.length !== 0) throw new Error("RLS leak: User B deleted User A action.");

  console.log("PASS: owner RLS blocks cross-user read/update/delete and allows own persistence.");
} finally {
  if (cleanup.measurementId) await a.from("health_measurements").delete().eq("id", cleanup.measurementId);
  if (cleanup.actionId) await a.from("action_items").delete().eq("id", cleanup.actionId);
  await a.auth.signOut();
  await b.auth.signOut();
}
