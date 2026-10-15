import { describe, expect, it } from "vitest";
import { recoveryFormSchema } from "./recovery-form.schema";

const validForm = {
  emergencySymptoms: "no",
  source: "self_report",
  assistanceNote: "",
  dailyActivity: "completed",
  perceivedLimitation: "not_reported",
  newConcerns: "no",
  practiceFrequency: "once",
  responseNote: "",
  confirmation: true,
};

describe("recoveryFormSchema", () => {
  it("accepts a complete self report", () => {
    expect(recoveryFormSchema.safeParse(validForm).success).toBe(true);
  });

  it("requires explicit confirmation and complete answers", () => {
    expect(recoveryFormSchema.safeParse({ ...validForm, confirmation: false }).success).toBe(false);
    expect(recoveryFormSchema.safeParse({ ...validForm, dailyActivity: undefined }).success).toBe(false);
  });

  it("requires an assistance note for assisted entry", () => {
    expect(recoveryFormSchema.safeParse({ ...validForm, source: "assisted" }).success).toBe(false);
    expect(recoveryFormSchema.safeParse({ ...validForm, source: "assisted", assistanceNote: "Dibantu menekan pilihan." }).success).toBe(true);
  });
});
