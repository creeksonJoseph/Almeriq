/**
 * Expert-domain HTTP operations. Components and hooks must not build endpoint URLs.
 */
import { apiClient, apiFetch, extractErrorMessage, invalidate } from "../client";

function apiError(error, fallback) {
  const normalized = new Error(extractErrorMessage(error, fallback));
  normalized.status = error.response?.status;
  normalized.detail = error.response?.data?.detail;
  normalized.response = error.response;
  return normalized;
}

async function request(fallback, operation) {
  try {
    const { data } = await operation();
    return data;
  } catch (error) {
    throw apiError(error, fallback);
  }
}

export const getExpertProfileApi = () =>
  request("Unable to load your expert profile.", () => apiClient.get("/api/expert/profile"));

export async function saveExpertProfileApi(payload) {
  const data = await request("Unable to save your expert profile.", () => apiClient.put("/api/expert/profile", payload));
  invalidate("public:experts");
  return data;
}

export const listExpertsCachedApi = (etag) => apiFetch("/api/experts", { etag });

export const listExpertRequestsApi = () =>
  request("Unable to load advisory requests.", () => apiClient.get("/api/expert/requests"));

export const updateExpertRequestApi = (id, status) =>
  request("Unable to update this advisory request.", () =>
    apiClient.patch(`/api/expert/requests/${encodeURIComponent(id)}`, { status }),
  );

export const listExpertsApi = () =>
  request("Unable to load expert profiles.", () => apiClient.get("/api/experts"));

export const listFounderExpertRequestsApi = () =>
  request("Unable to load your advisory requests.", () => apiClient.get("/api/founder/expert-requests"));

export const createExpertRequestApi = (expertUserId, payload) =>
  request("Unable to send your advisory request.", () =>
    apiClient.post(`/api/experts/${encodeURIComponent(expertUserId)}/requests`, payload),
  );
