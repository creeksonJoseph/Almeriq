import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/api", () => ({
  getInvestorProfileApi: vi.fn(),
  listInvestorStartupsApi: vi.fn(),
  listInvestorPortfolioApi: vi.fn(),
  createInvestmentApi: vi.fn(),
  updateInvestorPortfolioApi: vi.fn(),
  updateInvestorProfileApi: vi.fn(),
}));
vi.mock("../lib/api/conversations", () => ({
  startInvestmentConversationApi: vi.fn(),
}));

import * as api from "../lib/api";
import { startInvestmentConversationApi } from "../lib/api/conversations";
import { useInvestorWorkspace } from "./useInvestorWorkspace";

describe("useInvestorWorkspace", () => {
  const navigate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    api.getInvestorProfileApi.mockResolvedValue({ firm_name: "Northstar", preferred_payment_methods: ["mpesa"] });
    api.listInvestorStartupsApi.mockResolvedValue({ items: [{ id: 1, title: "Solar Grid" }] });
    api.listInvestorPortfolioApi.mockResolvedValue({ items: [{ id: 9, pitch_id: 1, status: "pending" }] });
    api.createInvestmentApi.mockResolvedValue({ id: 10, pitch_id: 2, status: "pending" });
    api.updateInvestorProfileApi.mockResolvedValue({ notify_messages: false });
    startInvestmentConversationApi.mockResolvedValue({ id: 42 });
  });

  it("loads investor profile, discovery and portfolio data concurrently", async () => {
    const { result } = renderHook(() => useInvestorWorkspace({ navigate }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile.firm_name).toBe("Northstar");
    expect(result.current.profile.preferred_payment_methods).toEqual(["mpesa"]);
    expect(result.current.startups).toHaveLength(1);
    expect(result.current.requests).toHaveLength(1);
  });

  it("adds a successful expression of interest to the local request list", async () => {
    const { result } = renderHook(() => useInvestorWorkspace({ navigate }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.expressInterest({ id: 2, title: "Clean Water" });
    });

    expect(api.createInvestmentApi).toHaveBeenCalledWith({ pitch_id: 2 });
    expect(result.current.requests[0]).toMatchObject({ id: 10, pitch_id: 2 });
    expect(result.current.notice).toContain("Clean Water");
    expect(result.current.busyPitch).toBeNull();
  });

  it("routes investment conversations to the shared messages workspace", async () => {
    const { result } = renderHook(() => useInvestorWorkspace({ navigate }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.openConversation(9);
    });

    expect(startInvestmentConversationApi).toHaveBeenCalledWith(9);
    expect(navigate).toHaveBeenCalledWith("/messages?conversation=42");
  });
});
