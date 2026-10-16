import { describe, expect, it } from "vitest";
import { getMobilePrimaryActiveKey, getMostSpecificActiveHref } from "./navigation-state";

const hrefs = [
  "/app/dashboard",
  "/app/screening",
  "/app/screening/gaps",
  "/app/screening/history",
  "/app/recovery",
  "/app/recovery/activity",
  "/app/recovery/progress",
];

describe("application navigation state", () => {
  it("selects only the most specific nested route", () => {
    expect(getMostSpecificActiveHref("/app/screening/gaps", hrefs)).toBe("/app/screening/gaps");
    expect(getMostSpecificActiveHref("/app/recovery/activity", hrefs)).toBe("/app/recovery/activity");
  });

  it("keeps parent routes active only when no more specific item exists", () => {
    expect(getMostSpecificActiveHref("/app/recovery", hrefs)).toBe("/app/recovery");
    expect(getMostSpecificActiveHref("/app/recovery/unknown", hrefs)).toBe("/app/recovery");
  });

  it("maps every mobile route to one primary navigation item", () => {
    expect(getMobilePrimaryActiveKey("/app/screening/history")).toBe("prevent");
    expect(getMobilePrimaryActiveKey("/app/recovery/activity")).toBe("recovery");
    expect(getMobilePrimaryActiveKey("/app/profile")).toBe("menu");
  });
});
