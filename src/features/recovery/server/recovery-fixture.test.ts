import { describe, expect, it } from "vitest";
import {
  RECOVERY_DEMO_INSTRUMENT_VERSION,
  recoveryCheckinCreateSchema,
  recoveryCreateResponseSchema,
  recoveryDetailResponseSchema,
  recoveryListResponseSchema,
  type RecoveryCheckinCreate,
} from "../recovery.contract";
import { selectRecoveryTrendPoints, toRecoveryTimelineEvent } from "../recovery.selectors";
import {
  baselineFixture,
  createRecoveryCheckinFixture,
  createRecoveryDetailFixture,
  createRecoveryHistoryFixture,
} from "./recovery-fixture";

function validInput(overrides: Partial<RecoveryCheckinCreate> = {}): RecoveryCheckinCreate {
  return {
    requestId: "d48270fb-f736-41a6-92b3-156f344341db",
    instrumentVersion: RECOVERY_DEMO_INSTRUMENT_VERSION,
    observedAt: "2026-10-15T09:00:00.000Z",
    safetyStatus: "clear",
    source: "self_report",
    assistanceNote: null,
    answers: [
      { questionId: "daily_activity_completion", responseId: "completed", note: null },
      { questionId: "perceived_limitation", responseId: "not_reported", note: null },
      { questionId: "new_concerns", responseId: "no", note: "Catatan sintetis." },
      { questionId: "practice_frequency", responseId: "once", note: null },
    ],
    confirmation: true,
    ...overrides,
  };
}

describe("recovery check-in contract and fixtures", () => {
  it("accepts a complete response set and preserves exact answers", () => {
    const input = validInput();
    expect(recoveryCheckinCreateSchema.safeParse(input).success).toBe(true);
    const response = createRecoveryCheckinFixture(input, false);
    expect(recoveryCreateResponseSchema.safeParse(response).success).toBe(true);
    expect(response.data.status).toBe("saved");
    if (response.data.status === "saved") expect(response.data.checkin.answers).toEqual(input.answers);
  });

  it("rejects incomplete, duplicated, mismatched and overlong responses", () => {
    const input = validInput();
    expect(recoveryCheckinCreateSchema.safeParse({ ...input, answers: input.answers.slice(0, 3) }).success).toBe(false);
    expect(recoveryCheckinCreateSchema.safeParse({ ...input, answers: input.answers.map((answer) => ({ ...answer, questionId: "new_concerns" })) }).success).toBe(false);
    expect(recoveryCheckinCreateSchema.safeParse({ ...input, answers: input.answers.map((answer, index) => index === 0 ? { ...answer, responseId: "once" } : answer) }).success).toBe(false);
    expect(recoveryCheckinCreateSchema.safeParse({ ...input, answers: input.answers.map((answer, index) => index === 0 ? { ...answer, note: "x".repeat(281) } : answer) }).success).toBe(false);
  });

  it("returns emergency without creating a check-in", () => {
    const response = createRecoveryCheckinFixture(validInput({ safetyStatus: "emergency" }), false);
    expect(response.data.status).toBe("emergency");
    expect("checkin" in response.data).toBe(false);
  });

  it("is idempotent for the same demo request identifier and timestamp", () => {
    const input = validInput();
    expect(createRecoveryCheckinFixture(input, true)).toEqual(createRecoveryCheckinFixture(input, true));
  });

  it("keeps the baseline unchanged when a follow-up is selected for trends", () => {
    const response = createRecoveryCheckinFixture(validInput(), false);
    if (response.data.status !== "saved") throw new Error("Expected saved fixture");
    const points = selectRecoveryTrendPoints([response.data.checkin, baselineFixture]);
    expect(points[0].isBaseline).toBe(true);
    expect(points[1].isBaseline).toBe(false);
    expect(baselineFixture.isBaseline).toBe(true);
    expect(toRecoveryTimelineEvent(response.data.checkin)).toMatchObject({ kind: "recovery_checkin", referenceId: response.data.checkin.id });
  });

  it("validates baseline, empty and not-found history responses", () => {
    const requestId = crypto.randomUUID();
    expect(recoveryListResponseSchema.safeParse(createRecoveryHistoryFixture("baseline", requestId)).success).toBe(true);
    expect(recoveryListResponseSchema.safeParse(createRecoveryHistoryFixture("empty", requestId)).success).toBe(true);
    const detail = createRecoveryDetailFixture(crypto.randomUUID(), requestId);
    expect(recoveryDetailResponseSchema.safeParse(detail).success).toBe(true);
    expect(detail.data.status).toBe("unavailable");
  });
});

