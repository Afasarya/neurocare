import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  motionActivityRequestSchema,
  type MotionActivityCreateResponse,
} from "@/features/rehab-motion/motion.contract";
import { createMotionUnavailableFixture } from "@/features/rehab-motion/server/motion-fixture";
import { readBoundedJsonBody, recoveryApiError, recoveryResponseHeaders } from "@/features/recovery/server/recovery-api";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const fallbackRequestId = crypto.randomUUID();
  const payload = await readBoundedJsonBody(request, MAX_BODY_BYTES);
  if (payload === "too_large") return recoveryApiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload aktivitas terlalu besar.");
  if (payload === "invalid_json") return recoveryApiError(400, fallbackRequestId, "INVALID_JSON", "Format permintaan tidak valid.");

  const parsed = motionActivityRequestSchema.safeParse(payload);
  if (!parsed.success) return recoveryApiError(400, fallbackRequestId, "INVALID_INPUT", "Data aktivitas belum valid atau lengkap.");

  if ("emergency" in parsed.data) {
    const response: MotionActivityCreateResponse = {
      data: { status: "emergency", message: "Pelacakan dihentikan. Cari bantuan darurat setempat dan jangan melanjutkan latihan." },
      meta: { requestId: parsed.data.requestId, generatedAt: new Date().toISOString(), demo: process.env.NODE_ENV !== "production" },
    };
    return Response.json(response, { headers: recoveryResponseHeaders });
  }

  const demo = request.headers.get("x-neurocare-motion-demo") === "motion-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) {
    return Response.json(createMotionUnavailableFixture(parsed.data), { headers: recoveryResponseHeaders });
  }

  const user = await authenticatedUser();
  if (user === "not_configured") return recoveryApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (!user) return recoveryApiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum menyimpan aktivitas.");

  const response: MotionActivityCreateResponse = {
    data: {
      status: "unavailable",
      reason: "activity_not_approved",
      retryable: false,
      message: "Latihan, algoritme, dan penyimpanan F06 belum disetujui. Tidak ada data yang disimpan.",
    },
    meta: { requestId: parsed.data.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
  return Response.json(response, { headers: recoveryResponseHeaders });
}

async function authenticatedUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return "not_configured" as const;
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : data.user;
}
