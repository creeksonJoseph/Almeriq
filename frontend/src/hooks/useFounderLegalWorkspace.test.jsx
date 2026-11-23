import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/api", () => ({ getCompanyRegistrationGuideApi: vi.fn() }));
vi.mock("../lib/api/founder", () => ({
  listLegalFilingsApi: vi.fn(),
  createLegalFilingApi: vi.fn(),
}));

import { getCompanyRegistrationGuideApi } from "../lib/api";
import { createLegalFilingApi, listLegalFilingsApi } from "../lib/api/founder";
import { useFounderLegalWorkspace } from "./useFounderLegalWorkspace";

describe("useFounderLegalWorkspace", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listLegalFilingsApi.mockResolvedValue([{ id: 1, filing_type: "company" }]);
    getCompanyRegistrationGuideApi.mockResolvedValue({ country: "Kenya", prerequisites: [] });
    createLegalFilingApi.mockResolvedValue({ id: 2 });
  });

  it("loads filing history and the selected country's registration guide", async () => {
    const { result } = renderHook(() => useFounderLegalWorkspace({
      selectedCountry: "Kenya",
      filingForm: {},
      setFilingForm: vi.fn(),
      showToast: vi.fn(),
    }));

    await waitFor(() => {
      expect(result.current.filingLoading).toBe(false);
      expect(result.current.guideLoading).toBe(false);
    });
    expect(result.current.filings).toHaveLength(1);
    expect(result.current.guide.country).toBe("Kenya");
  });

  it("submits a filing intake, refreshes the list and reports success", async () => {
    const showToast = vi.fn();
    const setFilingForm = vi.fn();
    const filingForm = {
      filing_type: "company", company_name: "Northstar Ltd", entity_type: "Ltd",
      jurisdiction: "", ip_title: "", ip_type: "Source Code", ip_description: "",
    };
    const { result } = renderHook(() => useFounderLegalWorkspace({
      selectedCountry: "Kenya", filingForm, setFilingForm, showToast,
    }));
    await waitFor(() => expect(result.current.filingLoading).toBe(false));

    await act(async () => {
      await result.current.submitFiling({ preventDefault: vi.fn() });
    });

    expect(createLegalFilingApi).toHaveBeenCalledWith(expect.objectContaining({
      company_name: "Northstar Ltd", jurisdiction: "Kenya",
    }));
    expect(listLegalFilingsApi).toHaveBeenCalledTimes(2);
    expect(setFilingForm).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      "Registration intake submitted. This does not file with a government office.",
      "success",
    );
  });
});
