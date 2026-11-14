import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../components/ui/index.js", () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  StatusPill: ({ status, label }) => (
    <span data-testid={`statuspill-${status}`}>{label || status}</span>
  ),
  Skeleton: () => <div data-testid="skeleton" />,
  SkeletonText: ({ lines }) => (
    <div data-testid="skeleton-text">
      {Array.from({ length: lines }).map((_, i) => <div key={i} />)}
    </div>
  ),
  SkeletonCard: ({ className }) => (
    <div data-testid="skeleton-card" className={className} />
  ),
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock("../../lib/api", () => ({
  getProviderProfileApi: vi.fn(),
  listOrdersApi: vi.fn(),
  listAssetsApi: vi.fn(),
  listConversationsApi: vi.fn(),
}));

import ProviderDashboardPage from "./ProviderDashboardPage.jsx";
import * as api from "../../lib/api";

describe("ProviderDashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows loading skeletons then renders dashboard", async () => {
    vi.mocked(api.getProviderProfileApi).mockResolvedValue({ name: "Acme Rentals" });
    vi.mocked(api.listOrdersApi).mockResolvedValue({ data: [] });
    vi.mocked(api.listAssetsApi).mockResolvedValue({ data: [] });
    vi.mocked(api.listConversationsApi).mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <ProviderDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
      expect(screen.getByText(/acme rentals/i)).toBeInTheDocument();
    });
  });

  it("shows error state when API fails", async () => {
    vi.mocked(api.getProviderProfileApi).mockRejectedValue(new Error("Failed to load"));
    vi.mocked(api.listOrdersApi).mockResolvedValue({ data: [] });
    vi.mocked(api.listAssetsApi).mockResolvedValue({ data: [] });
    vi.mocked(api.listConversationsApi).mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <ProviderDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
    });
  });

  it("renders active listings count from assets", async () => {
    vi.mocked(api.getProviderProfileApi).mockResolvedValue({ name: "Acme Rentals" });
    vi.mocked(api.listOrdersApi).mockResolvedValue({ data: [] });
    vi.mocked(api.listAssetsApi).mockResolvedValue({
      data: [{ id: 1, name: "CAT 336", status: "available", rate: "14,500" }],
    });
    vi.mocked(api.listConversationsApi).mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <ProviderDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/cat 336/i).length).toBeGreaterThan(0);
    });
  });
});
