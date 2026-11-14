import { describe, it, expect } from "vitest";

describe("Barrel directory import", () => {
  it("SkeletonText is importable from barrel directory", async () => {
    const mod = await import("../components/ui");
    expect(typeof mod.SkeletonText).toBe("function");
  });
});
