import type {
  CommunicationSessionCreate,
  CommunicationSessionResponse,
} from "../communication-rehab.contract";

/**
 * Development-only response. It deliberately says `simulated`, not `saved`,
 * because F09 has no approved database table or RLS policy yet.
 */
export function createCommunicationSessionFixture(
  input: CommunicationSessionCreate,
  now = new Date(),
): CommunicationSessionResponse {
  const { confirmation: _confirmation, ...session } = input;
  void _confirmation;

  return {
    data: {
      status: "simulated",
      message: "Sesi simulasi selesai. Catatan tidak disimpan ke basis data.",
      session,
    },
    meta: {
      requestId: input.requestId,
      generatedAt: now.toISOString(),
      demo: true,
    },
  };
}
