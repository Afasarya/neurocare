import type { MotionActivityCreate, MotionActivityCreateResponse } from "@/features/rehab-motion/motion.contract";

/** Development fixture is deliberately fail-closed: it never returns a saved record. */
export function createMotionUnavailableFixture(
  input: MotionActivityCreate,
  now = new Date(),
): MotionActivityCreateResponse {
  return {
    data: {
      status: "unavailable",
      reason: "algorithm_not_approved",
      retryable: false,
      message: "Algoritme repetisi dan latihan F06 belum disetujui. Tidak ada aktivitas yang disimpan.",
    },
    meta: { requestId: input.requestId, generatedAt: now.toISOString(), demo: true },
  };
}
