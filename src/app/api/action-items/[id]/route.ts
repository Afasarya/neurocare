import { actionItemUpdateSchema, type ActionItemUpdateResponse } from "@/features/health-records/health-records.contract";
import { authenticatedHealthUser, healthApiError, privateHealthHeaders, readHealthJson, unavailableMeta } from "@/features/health-records/server/health-records-api";
import { updateActionItemFixture } from "@/features/health-records/server/health-records-fixture";

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

  const response: ActionItemUpdateResponse = {
    data: { status: "unavailable", reason: "schema_not_approved", retryable: false, message: "Penyimpanan action item dan RLS belum disetujui. Status tidak diubah." },
    meta: unavailableMeta(parsed.data.requestId),
  };
  return Response.json(response, { headers: privateHealthHeaders });
}
