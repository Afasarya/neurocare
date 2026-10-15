import { describe, expect, it, vi } from "vitest";
import { stopMediaStream } from "./media-stream";

describe("stopMediaStream", () => {
  it("stops every track", () => {
    const first = { stop: vi.fn() };
    const second = { stop: vi.fn() };
    const stream = { getTracks: () => [first, second] } as unknown as Pick<MediaStream, "getTracks">;

    stopMediaStream(stream);

    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.stop).toHaveBeenCalledOnce();
  });

  it("accepts an absent stream", () => {
    expect(() => stopMediaStream(null)).not.toThrow();
  });
});

