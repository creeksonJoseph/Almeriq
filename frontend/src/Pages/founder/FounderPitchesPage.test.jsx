import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../lib/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../lib/api/conversations", () => ({
  startInvestmentConversationApi: vi.fn(),
}));

vi.mock("../../lib/api/founder", () => ({
  executeAiToolApi: vi.fn(),
}));

import * as client from "../../lib/client";
import FounderPitchesPage from "./FounderPitchesPage.jsx";

const apiGet = vi.mocked(client.apiClient.get);
const apiPost = vi.mocked(client.apiClient.post);
const apiPut = vi.mocked(client.apiClient.put);
const apiDelete = vi.mocked(client.apiClient.delete);

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
  apiGet.mockImplementation((url) => {
    if (String(url).includes("investment-requests")) {
      return Promise.resolve({ data: { items: [] } });
    }
    return Promise.resolve({ data: payload });
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  window.confirm = vi.fn(() => true);
  apiGet.mockImplementation((url) => {
    if (String(url).includes("investment-requests")) {
      return Promise.resolve({ data: { items: [] } });
    }
    return Promise.resolve({ data: [] });
  });
  apiPost.mockResolvedValue({ data: {} });
  apiPut.mockResolvedValue({ data: {} });
  apiDelete.mockResolvedValue({ data: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FounderPitchesPage pitch creation", () => {
  it("publishes a new pitch via POST and shows success notice", async () => {
    pitchList();
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

    fireEvent.click(screen.getByText(/publish pitch/i));

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith(
        "/api/founder/pitches",
        expect.objectContaining({ title: "Acme AI", ask_amount: 50000 }),
      );
    });
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

    fireEvent.submit(screen.getByRole("button", { name: /publish pitch/i }).closest("form"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/enter a pitch title and a valid non-negative funding ask/i);
    });
    expect(apiPost).not.toHaveBeenCalled();
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
      expect(apiPut).toHaveBeenCalledWith(
        "/api/founder/pitches/1",
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
      expect(apiDelete).toHaveBeenCalledWith("/api/founder/pitches/1");
    });
    await waitFor(() => {
      expect(screen.getByText(/pitch deleted/i)).toBeInTheDocument();
    });
  });
});
