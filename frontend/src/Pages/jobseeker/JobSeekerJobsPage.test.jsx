import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../lib/api/job", () => ({
  listJobsApi: vi.fn(),
  listMyJobApplicationsApi: vi.fn(),
  getJobSeekerProfileApi: vi.fn(),
  applyToJobApi: vi.fn(),
  withdrawJobApplicationApi: vi.fn(),
}));

import * as jobApi from "../../lib/api/job";
import JobSeekerJobsPage from "./JobSeekerJobsPage.jsx";

const listJobsApi = vi.mocked(jobApi.listJobsApi);
const listMyJobApplicationsApi = vi.mocked(jobApi.listMyJobApplicationsApi);
const getJobSeekerProfileApi = vi.mocked(jobApi.getJobSeekerProfileApi);
const applyToJobApi = vi.mocked(jobApi.applyToJobApi);

const JOB = {
  id: 42,
  title: "Backend Engineer",
  description: "Build APIs.",
  location: "Nairobi",
  role_type: "full_time",
  requirements: "Node.js",
  is_active: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  listJobsApi.mockResolvedValue({ items: [JOB] });
  listMyJobApplicationsApi.mockResolvedValue({ items: [] });
  getJobSeekerProfileApi.mockResolvedValue(null);
  applyToJobApi.mockResolvedValue({});
});

describe("JobSeekerJobsPage job application", () => {
  it("lists open jobs and shows an apply button", async () => {
    render(<MemoryRouter initialEntries={["/job-seeker/jobs"]}><JobSeekerJobsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/backend engineer/i)).toBeInTheDocument();
      expect(screen.getByText(/apply now/i)).toBeInTheDocument();
    });
    expect(listJobsApi).toHaveBeenCalled();
  });

  it("submits an application and marks the job as applied", async () => {
    listMyJobApplicationsApi
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [{ id: 1, job_posting_id: 42, status: "pending", applied_at: "2026-01-01T00:00:00Z" }] });

    render(<MemoryRouter initialEntries={["/job-seeker/jobs"]}><JobSeekerJobsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/apply now/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/apply now/i));

    await waitFor(() => {
      expect(applyToJobApi).toHaveBeenCalledWith(42, {
        resume_url: null,
        cover_letter: null,
      });
    });
    await waitFor(() => {
      expect(screen.getByText(/application submitted for backend engineer/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/applied/i)).toBeInTheDocument();
    });
  });
});
