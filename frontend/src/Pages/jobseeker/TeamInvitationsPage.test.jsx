import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../lib/api/team", () => ({
  listMyTeamInvitationsApi: vi.fn(),
  respondToTeamInvitationApi: vi.fn(),
}));

import * as teamApi from "../../lib/api/team";
import TeamInvitationsPage from "./TeamInvitationsPage.jsx";

const listMyTeamInvitationsApi = vi.mocked(teamApi.listMyTeamInvitationsApi);
const respondToTeamInvitationApi = vi.mocked(teamApi.respondToTeamInvitationApi);

const INVITATION = {
  id: "inv-1",
  other_party_name: "Sam Founder",
  status: "pending",
  message: "Join my team.",
};

beforeEach(() => {
  vi.resetAllMocks();
  listMyTeamInvitationsApi.mockResolvedValue({ items: [INVITATION] });
  respondToTeamInvitationApi.mockResolvedValue({});
});

describe("TeamInvitationsPage team invitation", () => {
  it("loads pending team invitations", async () => {
    render(<MemoryRouter><TeamInvitationsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/sam founder/i)).toBeInTheDocument();
      expect(screen.getByText(/accept invitation/i)).toBeInTheDocument();
      expect(screen.getByText(/decline/i)).toBeInTheDocument();
    });
    expect(listMyTeamInvitationsApi).toHaveBeenCalled();
  });

  it("accepts an invitation via the API", async () => {
    render(<MemoryRouter><TeamInvitationsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/accept invitation/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/accept invitation/i));

    await waitFor(() => {
      expect(respondToTeamInvitationApi).toHaveBeenCalledWith("inv-1", "accepted");
    });
    await waitFor(() => {
      expect(screen.getByText(/you joined the founder's team/i)).toBeInTheDocument();
    });
  });

  it("declines an invitation via the API", async () => {
    render(<MemoryRouter><TeamInvitationsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/decline/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/decline/i));

    await waitFor(() => {
      expect(respondToTeamInvitationApi).toHaveBeenCalledWith("inv-1", "declined");
    });
    await waitFor(() => {
      expect(screen.getByText(/invitation declined/i)).toBeInTheDocument();
    });
  });
});
