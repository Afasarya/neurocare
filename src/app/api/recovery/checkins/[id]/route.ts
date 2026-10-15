import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RecoveryDetailResponse } from "@/features/recovery/recovery.contract";
import { createRecoveryDetailFixture } from "@/features/recovery/server/recovery-fixture";
import { recoveryApiError, recoveryResponseHeaders } from "@/features/recovery/server/recovery-api";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/iu.test(id)) return recoveryApiError(400, requestId, "INVALID_ID", "ID check-in tidak valid.");

  const demo = request.headers.get("x-neurocare-recovery-demo") === "recovery-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) {
    return Response.json(createRecoveryDetailFixture(id, requestId), { headers: recoveryResponseHeaders });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return recoveryApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return recoveryApiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk melihat check-in.");

  const response: RecoveryDetailResponse = {
    data: { status: "unavailable", reason: "storage_not_configured", retryable: false, message: "Penyimpanan check-in belum disetujui atau dikonfigurasi." },
    meta: { requestId, generatedAt: new Date().toISOString(), demo: false },
  };
  return Response.json(response, { headers: recoveryResponseHeaders });
}
