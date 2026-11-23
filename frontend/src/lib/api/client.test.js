import { describe, it, expect, vi } from "vitest";
import { extractErrorMessage, fetchWithSWR, getCached, invalidate } from "../client";

// Mock axios for client tests
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe("api client error parser", () => {
  it("returns default message for unknown errors", () => {
    expect(extractErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("extracts detail string from response", () => {
    const err = { response: { data: { detail: "Asset not found" } } };
    expect(extractErrorMessage(err)).toBe("Asset not found");
  });

  it("joins detail array messages", () => {
    const err = { response: { data: { detail: [{ msg: "email invalid" }, { msg: "password short" }] } } };
    expect(extractErrorMessage(err)).toBe("email invalid, password short");
  });

  it("returns defaultMsg when error has no message", () => {
    expect(extractErrorMessage(null, "Custom default")).toBe("Custom default");
  });
});


describe("client SWR cache", () => {
  it("deduplicates concurrent requests for the same key", async () => {
    const key = "test:dedupe";
    invalidate(key);
    let resolveRequest;
    const fetcher = vi.fn(() => new Promise((resolve) => { resolveRequest = resolve; }));

    const first = fetchWithSWR(key, fetcher);
    const second = fetchWithSWR(key, fetcher);
    resolveRequest({ data: { items: [1] }, etag: '"v1"' });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { items: [1] },
      { items: [1] },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(getCached(key)).toEqual({ items: [1] });
  });

  it("keeps the cached response when a conditional request returns 304", async () => {
    const key = "test:not-modified";
    invalidate(key);
    const initial = { items: ["existing"] };
    const fetcher = vi.fn().mockResolvedValue({ data: initial, etag: '"v2"' });
    await fetchWithSWR(key, fetcher);

    const unchanged = await fetchWithSWR(key, vi.fn().mockResolvedValue(null), { force: true });
    expect(unchanged).toEqual(initial);
    expect(getCached(key)).toEqual(initial);
  });
});
