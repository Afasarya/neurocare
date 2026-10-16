import { describe, expect, it, vi } from "vitest";
import { classifyMotionCameraError, getMotionCameraConstraints, stopMotionStream } from "./media-stream";

describe("stopMotionStream", () => {
  it("stops every media track and accepts an absent stream", () => {
    const first = { stop: vi.fn() };
    const second = { stop: vi.fn() };
    stopMotionStream({ getTracks: () => [first, second] } as unknown as MediaStream);
    stopMotionStream(null);
    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.stop).toHaveBeenCalledOnce();
  });
});

describe("motion camera readiness", () => {
  it("requests video only with the user-facing camera preferred", () => {
    expect(getMotionCameraConstraints()).toEqual({
      audio: false,
      video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
  });

  it("maps permission and hardware errors to stable UI states", () => {
    expect(classifyMotionCameraError({ name: "NotAllowedError" })).toBe("denied");
    expect(classifyMotionCameraError({ name: "NotFoundError" })).toBe("unavailable");
    expect(classifyMotionCameraError({ name: "NotReadableError" })).toBe("unavailable");
    expect(classifyMotionCameraError(new Error("unexpected"))).toBe("unknown");
  });
});
