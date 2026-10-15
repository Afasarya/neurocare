import { z } from "zod";
import type { ActionItemsResponse } from "@/features/health-records/health-records.contract";
import { authenticatedHealthUser, healthApiError, privateHealthHeaders, unavailableMeta } from "@/features/health-records/server/health-records-api";
import { createActionItemsFixture, type ActionDemoScenario } from "@/features/health-records/server/health-records-fixture";
import { HealthRecordsStorageError, listActionItems } from "@/features/health-records/server/health-records-repository";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const demo = request.headers.get("x-neurocare-records-demo") === "health-records-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) {
    const requested = new URL(request.url).searchParams.get("scenario");
    const scenario: ActionDemoScenario = requested === "empty" || requested === "unavailable" ? requested : "baseline";
    return Response.json(createActionItemsFixture(scenario, requestId), { headers: privateHealthHeaders });
  }

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") return healthApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (auth.status === "unauthenticated") return healthApiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk melihat rencana.");

  try {
    const items = await listActionItems(auth.supabase, auth.user.id);
    const response: ActionItemsResponse = items.length === 0
      ? { data: { status: "empty", message: "Belum ada rencana tindak lanjut dari sumber yang tersimpan." }, meta: unavailableMeta(requestId) }
      : { data: { status: "ok", items, lastUpdatedAt: items[0].updatedAt }, meta: unavailableMeta(requestId) };
    return Response.json(response, { headers: privateHealthHeaders });
  } catch (error) {
    const storageKind = error instanceof HealthRecordsStorageError ? error.kind : "service_error";
    const reason = storageKind === "not_found" ? "service_error" : storageKind;
    const response: ActionItemsResponse = {
      data: { status: "unavailable", reason, retryable: reason === "service_error", message: reason === "storage_not_configured" ? "Penyimpanan rencana belum tersedia. Terapkan migration database NeuroCare terlebih dahulu." : "Rencana belum dapat dimuat. Periksa koneksi lalu coba lagi." },
      meta: unavailableMeta(requestId),
    };
    return Response.json(response, { headers: privateHealthHeaders });
  }
}

const createActionItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  pathway: z.enum(["neuroprevent", "neurorecovery", "shared"]).default("neuroprevent"),
  dedupeKey: z.string().min(1),
  sourceLabel: z.string().default("Gap Skrining"),
  sourceReferenceId: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") return healthApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (auth.status === "unauthenticated") return healthApiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk menambah rencana.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return healthApiError(400, requestId, "INVALID_JSON", "Format JSON tidak valid.");
  }

  const parsed = createActionItemSchema.safeParse(body);
  if (!parsed.success) {
    return healthApiError(400, requestId, "INVALID_INPUT", "Data rencana tindakan tidak lengkap.");
  }

  const { data, error } = await auth.supabase
    .from("action_items")
    .upsert({
      user_id: auth.user.id,
      dedupe_key: parsed.data.dedupeKey,
      title: parsed.data.title,
      description: parsed.data.description,
      pathway: parsed.data.pathway,
      status: "pending",
      due_at: parsed.data.dueAt ?? null,
      source_kind: "user_created",
      source_label: parsed.data.sourceLabel,
      source_reference_id: parsed.data.sourceReferenceId ?? null,
    }, { onConflict: "user_id,dedupe_key" })
    .select()
    .single();

  if (error || !data) {
    return healthApiError(500, requestId, "STORAGE_ERROR", "Gagal menyimpan rencana tindakan.");
  }

  return Response.json({ status: "ok", item: data }, { status: 201, headers: privateHealthHeaders });
}
