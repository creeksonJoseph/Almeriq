/**
 * lib/api/founder.js - Founder analysis & venture history API calls.
 */
import { apiClient, apiFetch, extractErrorMessage } from "../client";

function apiErr(error, defaultMsg) {
  if (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT" ||
    (typeof error?.message === "string" && error.message.toLowerCase().includes("timeout"))
  ) {
    const err = new Error("Request timed out. Please try again.");
    err.status = 408;
    return err;
  }
  // Extract backend error message if available (already cleaned by backend)
  const backendMsg = error.response?.data?.detail;
  const msg = backendMsg || extractErrorMessage(error, defaultMsg);
  
  const err = new Error(msg);
  err.status = error.response?.status;
  err.detail = error.response?.data?.detail;
  return err;
}

export async function saveBriefApi(payload) {
  try {
    const { data } = await apiClient.post("/founder/save-brief", payload);
    return data; // { venture_id, message }
  } catch (e) {
    throw apiErr(e, "Unable to save your idea");
  }
}

export async function analyzeFounderIdeaApi(payload) {
  try {
    const { data } = await apiClient.post("/founder/analyze", payload, {
      timeout: 60000,
    });
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to analyze your idea");
  }
}

export async function listVenturesApi() {
  try {
    const { data } = await apiClient.get("/founder/ventures");
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to load saved ideas");
  }
}

export async function getVentureApi(id) {
  try {
    const { data } = await apiClient.get(`/founder/ventures/${id}`);
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to load venture");
  }
}

export async function deleteVentureApi(id) {
  try {
    await apiClient.delete(`/founder/ventures/${id}`);
  } catch (e) {
    throw apiErr(e, "Unable to delete venture");
  }
}

export async function getValidationApi() {
  try {
    const { data } = await apiClient.get("/founder/validation");
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to load validation rubric");
  }
}

export async function updateValidationApi(dims) {
  try {
    const { data } = await apiClient.put("/founder/validation", dims);
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to save validation rubric");
  }
}

export async function listLegalFilingsApi() {
  try {
    const { data } = await apiClient.get("/founder/legal");
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to load legal filings");
  }
}

export async function createLegalFilingApi(payload) {
  try {
    const { data } = await apiClient.post("/founder/legal", payload);
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to submit legal filing");
  }
}

export async function getCompanyRegistrationGuideApi(country = "", refresh = false) {
  try {
    const params = {};
    if (country) params.country = country;
    if (refresh) params.refresh = true;
    const { data } = await apiClient.get("/founder/legal/company-guide", {
      params,
      timeout: 45000,
    });
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to load company registration guide");
  }
}

export async function executeAiToolApi(payload) {
  try {
    const { data } = await apiClient.post("/founder/ai-tools", payload, {
      timeout: 60000,
    });
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to run analysis");
  }
}


// ── Fundraising pitches and investor interest ────────────────────────────────
export async function listFounderPitchesApi() {
  try {
    const { data } = await apiClient.get("/api/founder/pitches");
    return Array.isArray(data) ? data : data?.items || [];
  } catch (e) {
    throw apiErr(e, "Unable to load your pitches");
  }
}

export async function listFounderInvestmentRequestsApi() {
  try {
    const { data } = await apiClient.get("/api/founder/investment-requests");
    return data?.items || [];
  } catch (e) {
    throw apiErr(e, "Unable to load investor interest");
  }
}

export async function createFounderPitchApi(payload) {
  try {
    const { data } = await apiClient.post("/api/founder/pitches", payload);
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to publish this pitch");
  }
}

export async function updateFounderPitchApi(id, payload) {
  try {
    const { data } = await apiClient.put(`/api/founder/pitches/${encodeURIComponent(id)}`, payload);
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to update this pitch");
  }
}

export async function updateFounderInvestmentRequestApi(id, status) {
  try {
    const { data } = await apiClient.patch(
      `/api/founder/investment-requests/${encodeURIComponent(id)}`,
      { status },
    );
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to update this investor request");
  }
}

export async function publishFounderPitchApi(id) {
  try {
    const { data } = await apiClient.post(`/api/founder/pitches/${id}/publish`);
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to publish this pitch");
  }
}

export async function unpublishFounderPitchApi(id) {
  try {
    const { data } = await apiClient.post(`/api/founder/pitches/${id}/unpublish`);
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to unpublish this pitch");
  }
}

export async function deleteFounderPitchApi(id) {
  try {
    await apiClient.delete(`/api/founder/pitches/${encodeURIComponent(id)}`);
  } catch (e) {
    throw apiErr(e, "Unable to delete this pitch");
  }
}


/** ETag-aware read for the authenticated user's venture history. */
export const getVenturesCachedApi = (etag) => apiFetch("/founder/ventures", { etag });
