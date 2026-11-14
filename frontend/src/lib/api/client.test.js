import { describe, it, expect, vi } from "vitest";
import { extractErrorMessage } from "../client";

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
