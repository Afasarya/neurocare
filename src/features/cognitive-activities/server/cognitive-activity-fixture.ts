import type {
  CognitiveActivitySessionCreate,
  CognitiveActivitySessionResponse,
} from "../cognitive-activity.contract";

/** Development-only: no database record is created. */
export function createCognitiveActivityFixture(
  input: CognitiveActivitySessionCreate,
  now = new Date(),
): CognitiveActivitySessionResponse {
  const { confirmation: _confirmation, ...session } = input;
  void _confirmation;

  return {
    data: {
      status: "simulated",
      message: "Sesi simulasi selesai. Aktivitas ini tidak disimpan dan tidak menghasilkan skor klinis.",
      session,
    },
    meta: { requestId: input.requestId, generatedAt: now.toISOString(), demo: true },
  };
}
