let navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";

vi.mock("../../components/ui/index.js", () => ({
  Button: ({ children, onClick, ...props }) => (
    <button data-testid="btn" onClick={onClick} {...props}>{children}</button>
  ),
  Input: ({ ...props }) => <input data-testid="input" {...props} />,
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  Stepper: () => <div data-testid="stepper" />,
  Pill: ({ children }) => <span data-testid="pill">{children}</span>,
  Modal: ({ children }) => <div data-testid="modal">{children}</div>,
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("../../lib/api", () => ({
  getProviderProfileApi: vi.fn(),
  updateProviderProfileApi: vi.fn(),
  listCoverageRegionsApi: vi.fn(),
  updateCoverageRegionsApi: vi.fn(),
  listAssetsApi: vi.fn(),
  createAssetApi: vi.fn(),
  updateAssetApi: vi.fn(),
  deleteAssetApi: vi.fn(),
}));

import * as api from "../../lib/api";
import ProviderSetupPage from "./ProviderSetupPage.jsx";

const setup = () => {
  window.alert = vi.fn();
  navigateMock.mockClear();
  const all = [
    api.getProviderProfileApi,
    api.updateProviderProfileApi,
    api.listCoverageRegionsApi,
    api.updateCoverageRegionsApi,
    api.listAssetsApi,
    api.createAssetApi,
    api.updateAssetApi,
    api.deleteAssetApi,
  ];
  all.forEach((fn) => vi.mocked(fn).mockReset());
  vi.mocked(api.getProviderProfileApi).mockResolvedValue(null);
  vi.mocked(api.listCoverageRegionsApi).mockResolvedValue({ items: [] });
  vi.mocked(api.listAssetsApi).mockResolvedValue({ items: [] });
  return render(
    <MemoryRouter>
      <ProviderSetupPage />
    </MemoryRouter>
  );
};

const advanceToPhysical = async () => {
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/terraBore/i)).toBeInTheDocument();
  });
  fireEvent.change(screen.getByPlaceholderText(/terraBore/i), {
    target: { value: "Test Provider Co" },
  });
  fireEvent.change(screen.getByPlaceholderText(/austin/i), {
    target: { value: "Austin, United States" },
  });
  fireEvent.click(screen.getAllByText(/company/i)[0]);
  fireEvent.click(screen.getAllByText(/continue/i)[0]);
  await waitFor(() => {
    expect(screen.getByText(/add physical asset/i)).toBeInTheDocument();
  });
};

const clickSaveDraft = () => {
  const buttons = screen.getAllByText(/save draft/i);
  fireEvent.click(buttons[buttons.length - 1]);
};

describe("ProviderSetupPage asset behavior", () => {
  it("sends client_asset_id when saving a physical asset draft", async () => {
    setup();
    vi.mocked(api.createAssetApi).mockResolvedValue({
      id: 7,
      client_asset_id: "cid-123",
      name: "Excavator",
    });
    vi.mocked(api.updateProviderProfileApi).mockResolvedValue({});
    vi.mocked(api.updateCoverageRegionsApi).mockResolvedValue({});

    await advanceToPhysical();
    fireEvent.click(screen.getByText(/add physical asset/i));

    fireEvent.change(screen.getByPlaceholderText(/caterpillar/i), {
      target: { value: "CAT 336" },
    });
    clickSaveDraft();

    await waitFor(() => {
      expect(api.createAssetApi).toHaveBeenCalled();
    });
    const payload = api.createAssetApi.mock.calls[0][0];
    expect(payload.kind).toBe("physical");
    expect(payload.client_asset_id).toBeDefined();
    expect(typeof payload.client_asset_id).toBe("string");
  });

  it("updates the existing asset on repeat draft save instead of duplicating", async () => {
    setup();
    vi.mocked(api.createAssetApi).mockResolvedValue({
      id: 7,
      client_asset_id: "cid-dup",
      name: "Excavator",
    });
    vi.mocked(api.updateAssetApi).mockResolvedValue({ id: 7 });
    vi.mocked(api.updateProviderProfileApi).mockResolvedValue({});
    vi.mocked(api.updateCoverageRegionsApi).mockResolvedValue({});

    await advanceToPhysical();
    fireEvent.click(screen.getByText(/add physical asset/i));

    fireEvent.change(screen.getByPlaceholderText(/caterpillar/i), {
      target: { value: "CAT 336" },
    });
    clickSaveDraft();
    await waitFor(() => expect(api.createAssetApi).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    clickSaveDraft();
    await waitFor(() => {
      expect(api.updateAssetApi).toHaveBeenCalled();
    });
    expect(api.updateAssetApi.mock.calls[0][0]).toBe(7);
  });

  it("displays category validation error beside the category select", async () => {
    setup();
    vi.mocked(api.updateProviderProfileApi).mockResolvedValue({});
    vi.mocked(api.updateCoverageRegionsApi).mockResolvedValue({});

    await advanceToPhysical();
    fireEvent.click(screen.getByText(/add physical asset/i));

    clickSaveDraft();

    await waitFor(() => {
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    });
  });

  it("surfaces deletion failure during save and keeps asset pending", async () => {
    setup();
    vi.mocked(api.deleteAssetApi).mockRejectedValue(new Error("delete failed"));
    vi.mocked(api.createAssetApi).mockResolvedValue({
      id: 3,
      client_asset_id: "cid-del",
      name: "Existing",
    });
    vi.mocked(api.updateProviderProfileApi).mockResolvedValue({});
    vi.mocked(api.updateCoverageRegionsApi).mockResolvedValue({});

    await advanceToPhysical();
    fireEvent.click(screen.getByText(/add physical asset/i));

    fireEvent.change(screen.getByPlaceholderText(/caterpillar/i), {
      target: { value: "Existing Asset" },
    });
    clickSaveDraft();
    await waitFor(() => expect(api.createAssetApi).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/remove/i));
    // saving retries the pending deletion; failure is surfaced via alert
    clickSaveDraft();
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("could not be deleted")
      );
    });
  });

  it("keeps failed deletions pending and retries on next save draft", async () => {
    setup();
    vi.mocked(api.deleteAssetApi).mockRejectedValue(new Error("delete failed"));
    vi.mocked(api.createAssetApi).mockResolvedValue({
      id: 5,
      client_asset_id: "cid-retry",
      name: "Retry Asset",
    });
    vi.mocked(api.updateProviderProfileApi).mockResolvedValue({});
    vi.mocked(api.updateCoverageRegionsApi).mockResolvedValue({});

    await advanceToPhysical();
    fireEvent.click(screen.getByText(/add physical asset/i));

    fireEvent.change(screen.getByPlaceholderText(/caterpillar/i), {
      target: { value: "Retry Asset" },
    });
    clickSaveDraft();
    await waitFor(() => expect(api.createAssetApi).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/remove/i));
    // removing only tracks the pending deletion; saving triggers the API call
    clickSaveDraft();
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("could not be deleted")
      );
    });

    // retry the pending deletion on the next save draft
    vi.mocked(api.deleteAssetApi).mockResolvedValue({});
    clickSaveDraft();
    await waitFor(() => expect(api.deleteAssetApi).toHaveBeenCalledTimes(2));
  });

  it("does not report partial asset-save failures as complete success", async () => {
    setup();
    vi.mocked(api.createAssetApi).mockRejectedValue(new Error("save failed"));
    vi.mocked(api.updateProviderProfileApi).mockResolvedValue({});
    vi.mocked(api.updateCoverageRegionsApi).mockResolvedValue({});

    await advanceToPhysical();
    fireEvent.click(screen.getByText(/add physical asset/i));

    fireEvent.change(screen.getByPlaceholderText(/caterpillar/i), {
      target: { value: "Failing Asset" },
    });
    clickSaveDraft();

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("failed to save")
      );
    });
  });

  it("does not navigate to /provider/dashboard when pending deletion fails", async () => {
    setup();
    vi.mocked(api.listAssetsApi).mockResolvedValue({
      items: [
        {
          id: 3,
          client_asset_id: "del-1",
          name: "Old Asset",
          category: "Heavy Earthmoving / Excavation",
          kind: "physical",
          specs: { quantity: "", capacity: "", availability: "", rate: "" },
        },
      ],
    });
    vi.mocked(api.deleteAssetApi).mockRejectedValue(new Error("delete failed"));
    vi.mocked(api.createAssetApi).mockResolvedValue({});
    vi.mocked(api.updateAssetApi).mockResolvedValue({});
    vi.mocked(api.updateProviderProfileApi).mockResolvedValue({});
    vi.mocked(api.updateCoverageRegionsApi).mockResolvedValue({});

    await advanceToPhysical();

    // The pre-existing asset (id 3) is loaded with a remove button.
    fireEvent.click(screen.getAllByText(/remove/i)[0]);
    // confirm the asset entered pending deletions (delete API not yet called)
    expect(api.deleteAssetApi).not.toHaveBeenCalled();

    // Walk through the remaining steps to reach Complete Setup.
    fireEvent.click(screen.getAllByText(/continue/i)[0]);
    await waitFor(() => {
      expect(screen.getByText(/add digital asset/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText(/continue/i)[0]);
    await waitFor(() => {
      expect(screen.getByText(/africa/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/africa/i));
    fireEvent.click(screen.getAllByText(/continue/i)[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/company size/i)).toBeInTheDocument();
    });

    // Submit Complete Setup.
    fireEvent.click(screen.getByText(/complete setup/i));
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Deletion was attempted with the asset's form id.
    await waitFor(() => expect(api.deleteAssetApi).toHaveBeenCalledTimes(1));
    expect(typeof api.deleteAssetApi.mock.calls[0][0]).toBe("string");
    // Failure is surfaced to the user.
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("could not be deleted")
      );
    });
    // Navigation was NOT triggered.
    expect(navigateMock).not.toHaveBeenCalledWith("/provider/dashboard");
    // The component is still mounted (no navigation occurred).
    expect(screen.getByText(/complete setup/i)).toBeInTheDocument();
  });
});
