/**
 * lib/api/job.js - Job seeker and employer recruitment API client.
 *
 * Keeps job-domain HTTP calls in one place and normalizes API errors.
 */
import { apiClient, extractErrorMessage } from "../client";

function apiErr(error, fallback) {
  const err = new Error(extractErrorMessage(error, fallback));
  err.status = error.response?.status;
  err.detail = error.response?.data?.detail;
  return err;
}

async function request(fallback, operation) {
  try {
    const { data } = await operation();
    return data;
  } catch (error) {
    throw apiErr(error, fallback);
  }
}

// ── Job seeker profile ───────────────────────────────────────────────────────

export function getJobSeekerProfileApi() {
  return request("Failed to load your job seeker profile", () =>
    apiClient.get("/api/job-seeker/profile"),
  );
}

export function saveJobSeekerProfileApi(payload) {
  return request("Failed to save your job seeker profile", () =>
    apiClient.put("/api/job-seeker/profile", payload),
  );
}

// ── Job discovery ────────────────────────────────────────────────────────────

export function listJobsApi(params = {}) {
  return request("Failed to load jobs", () =>
    apiClient.get("/api/jobs", { params }),
  );
}

export function getJobApi(jobId) {
  return request("Failed to load this job", () =>
    apiClient.get(`/api/jobs/${encodeURIComponent(jobId)}`),
  );
}

// ── Employer job management ──────────────────────────────────────────────────

export function createJobApi(payload) {
  return request("Failed to create job posting", () =>
    apiClient.post("/api/jobs", payload),
  );
}

export function updateJobApi(jobId, payload) {
  return request("Failed to update job posting", () =>
    apiClient.put(`/api/jobs/${encodeURIComponent(jobId)}`, payload),
  );
}

export async function deleteJobApi(jobId) {
  await request("Failed to delete job posting", () =>
    apiClient.delete(`/api/jobs/${encodeURIComponent(jobId)}`),
  );
}

// ── Applications ────────────────────────────────────────────────────────────

export function applyToJobApi(jobId, payload = {}) {
  return request("Failed to submit your application", () =>
    apiClient.post(
      `/api/jobs/${encodeURIComponent(jobId)}/apply`,
      payload,
    ),
  );
}

export function listMyJobApplicationsApi(params = {}) {
  return request("Failed to load your applications", () =>
    apiClient.get("/api/job-seeker/applications", { params }),
  );
}

export function getMyJobApplicationApi(applicationId) {
  return request("Failed to load this application", () =>
    apiClient.get(
      `/api/job-seeker/applications/${encodeURIComponent(applicationId)}`,
    ),
  );
}

export function withdrawJobApplicationApi(applicationId) {
  return request("Failed to withdraw your application", () =>
    apiClient.put(
      `/api/job-seeker/applications/${encodeURIComponent(applicationId)}`,
      { status: "withdrawn" },
    ),
  );
}

// ── Employer applicant management ───────────────────────────────────────────

export function listJobApplicationsApi(jobId) {
  return request("Failed to load applications for this job", () =>
    apiClient.get(
      `/api/jobs/${encodeURIComponent(jobId)}/applications`,
    ),
  );
}

export function reviewJobApplicationApi(jobId, applicationId, status) {
  return request("Failed to update application status", () =>
    apiClient.patch(
      `/api/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}`,
      { status },
    ),
  );
}
