import { actionItemUpdateSchema, type ActionItemUpdateResponse } from "@/features/health-records/health-records.contract";
import { authenticatedHealthUser, healthApiError, privateHealthHeaders, readHealthJson, unavailableMeta } from "@/features/health-records/server/health-records-api";
import { updateActionItemFixture } from "@/features/health-records/server/health-records-fixture";
import { HealthRecordsStorageError, updateActionItem } from "@/features/health-records/server/health-records-repository";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const fallbackRequestId = crypto.randomUUID();
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/iu.test(id)) return healthApiError(400, fallbackRequestId, "INVALID_ID", "ID rencana tidak valid.");
  const payload = await readHealthJson(request);
  if (payload === "too_large") return healthApiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload perubahan terlalu besar.");
  if (payload === "invalid_json") return healthApiError(400, fallbackRequestId, "INVALID_JSON", "Format permintaan tidak valid.");
  const parsed = actionItemUpdateSchema.safeParse(payload);
  if (!parsed.success) return healthApiError(400, fallbackRequestId, "INVALID_INPUT", "Status rencana tidak valid.");

  const demo = request.headers.get("x-neurocare-records-demo") === "health-records-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) return Response.json(updateActionItemFixture(id, parsed.data), { headers: privateHealthHeaders });

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") return healthApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (auth.status === "unauthenticated") return healthApiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum mengubah rencana.");

  try {
    const item = await updateActionItem(auth.supabase, auth.user.id, id, parsed.data);
    const response: ActionItemUpdateResponse = {
      data: { status: "saved", item },
      meta: unavailableMeta(parsed.data.requestId),
    };
    return Response.json(response, { headers: privateHealthHeaders });
  } catch (error) {
    const reason = error instanceof HealthRecordsStorageError ? error.kind : "service_error";
    const response: ActionItemUpdateResponse = {
      data: { status: "unavailable", reason, retryable: reason === "service_error", message: reason === "not_found" ? "Rencana tidak ditemukan atau bukan milik akun ini." : reason === "storage_not_configured" ? "Penyimpanan rencana belum tersedia. Terapkan migration database NeuroCare terlebih dahulu." : "Status rencana belum dapat disimpan. Periksa koneksi lalu coba lagi." },
      meta: unavailableMeta(parsed.data.requestId),
    };
    return Response.json(response, { headers: privateHealthHeaders });
  }
}
