/**
 * lib/api/founder.js - Founder analysis & venture history API calls.
 */
import { apiClient, extractErrorMessage } from "../client";

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
