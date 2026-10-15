import { describe, expect, it, vi } from "vitest";
import { stopMotionStream } from "./media-stream";

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
