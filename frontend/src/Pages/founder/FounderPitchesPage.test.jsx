import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../lib/api/founder", () => ({
  executeAiToolApi: vi.fn(),
  listFounderPitchesApi: vi.fn(),
  listFounderInvestmentRequestsApi: vi.fn(),
  createFounderPitchApi: vi.fn(),
  updateFounderPitchApi: vi.fn(),
  updateFounderInvestmentRequestApi: vi.fn(),
  publishFounderPitchApi: vi.fn(),
  unpublishFounderPitchApi: vi.fn(),
  deleteFounderPitchApi: vi.fn(),
}));

vi.mock("../../lib/api/conversations", () => ({
  startInvestmentConversationApi: vi.fn(),
}));



import * as founderApi from "../../lib/api/founder";
import FounderPitchesPage from "./FounderPitchesPage.jsx";

const listPitches = vi.mocked(founderApi.listFounderPitchesApi);
const listRequests = vi.mocked(founderApi.listFounderInvestmentRequestsApi);
const createPitch = vi.mocked(founderApi.createFounderPitchApi);
const updatePitch = vi.mocked(founderApi.updateFounderPitchApi);
const deletePitch = vi.mocked(founderApi.deleteFounderPitchApi);
const publishPitch = vi.mocked(founderApi.publishFounderPitchApi);

const PITCH = {
  id: 1,
  title: "Existing Pitch",
  summary: "Existing summary",
  sector: "Fintech",
  stage: "Pre-seed",
  ask_amount: 50000,
  location: "Nairobi",
  target_check_size: 10000,
  website_url: "",
  pitch_deck_url: "",
  financials_url: "",
  traction: "",
  team_summary: "",
  documents: [],
};

const pitchList = (payload = []) => {
  listPitches.mockResolvedValue(payload);
  listRequests.mockResolvedValue([]);
};

beforeEach(() => {
  vi.resetAllMocks();
  window.confirm = vi.fn(() => true);
  listPitches.mockResolvedValue([]);
  listRequests.mockResolvedValue([]);
  createPitch.mockResolvedValue({});
  updatePitch.mockResolvedValue({});
  deletePitch.mockResolvedValue(undefined);
  publishPitch.mockResolvedValue({ id: 1, status: "active" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FounderPitchesPage pitch creation", () => {
  it("saves a new pitch as a draft and publishes it in a separate action", async () => {
    listPitches.mockResolvedValueOnce([]).mockResolvedValue([{
      ...PITCH,
      id: 7,
      title: "Acme AI",
      status: "draft",
    }]);
    listRequests.mockResolvedValue([]);
    render(<MemoryRouter><FounderPitchesPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/create a pitch/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/company or product name/i), {
      target: { value: "Acme AI" },
    });
    fireEvent.change(screen.getByPlaceholderText(/problem, solution, traction/i), {
      target: { value: "A platform for freelance infrastructure." },
    });
    fireEvent.change(screen.getByPlaceholderText(/fintech/i), {
      target: { value: "Fintech" },
    });
    fireEvent.change(screen.getByPlaceholderText(/pre-seed/i), {
      target: { value: "Pre-seed" },
    });
    fireEvent.change(screen.getByPlaceholderText(/optional amount/i), {
      target: { value: "50000" },
    });
    fireEvent.change(screen.getByPlaceholderText(/nairobi, kenya/i), {
      target: { value: "Nairobi, Kenya" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save as draft/i }));

    await waitFor(() => {
      expect(createPitch).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Acme AI", ask_amount: 50000 }),
      );
    });
    await waitFor(() => expect(screen.getByText(/draft saved/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /^publish$/i }));

    await waitFor(() => expect(publishPitch).toHaveBeenCalledWith(7));
    await waitFor(() => {
      expect(screen.getByText(/pitch published to investor discovery/i)).toBeInTheDocument();
    });
  });

  it("shows a validation error for an invalid funding ask and does not call the API", async () => {
    pitchList();
    render(<MemoryRouter><FounderPitchesPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/create a pitch/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/company or product name/i), {
      target: { value: "Acme AI" },
    });
    fireEvent.change(screen.getByPlaceholderText(/optional amount/i), {
      target: { value: "-100" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /save as draft/i }).closest("form"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/enter a pitch title and a valid non-negative funding ask/i);
    });
    expect(createPitch).not.toHaveBeenCalled();
  });

  it("loads an existing pitch into the form for editing", async () => {
    pitchList([PITCH]);
    render(<MemoryRouter><FounderPitchesPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/existing pitch/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/edit/i));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/company or product name/i)).toHaveValue("Existing Pitch");
    });
    expect(screen.getByText(/edit pitch/i)).toBeInTheDocument();
  });

  it("updates an existing pitch via PUT when editing", async () => {
    pitchList([PITCH]);
    render(<MemoryRouter><FounderPitchesPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/existing pitch/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/edit/i));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/company or product name/i)).toHaveValue("Existing Pitch");
    });
    fireEvent.change(screen.getByPlaceholderText(/company or product name/i), {
      target: { value: "Updated Pitch" },
    });
    fireEvent.click(screen.getByText(/update pitch/i));

    await waitFor(() => {
      expect(updatePitch).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: "Updated Pitch" }),
      );
    });
  });

  it("deletes a pitch via DELETE after confirmation", async () => {
    pitchList([PITCH]);
    render(<MemoryRouter><FounderPitchesPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/existing pitch/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/delete/i));

    await waitFor(() => {
      expect(deletePitch).toHaveBeenCalledWith(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/pitch deleted/i)).toBeInTheDocument();
    });
  });
});
