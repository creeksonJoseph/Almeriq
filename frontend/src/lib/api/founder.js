/**
 * lib/api/founder.js - Founder analysis API calls.
 */
import { apiClient, extractErrorMessage } from "../client";

function apiErr(error, msg) {
  const err = new Error(extractErrorMessage(error, msg));
  err.status = error.response?.status;
  err.detail = error.response?.data?.detail;
  return err;
}

export async function analyzeFounderIdeaApi(payload) {
  try {
    const { data } = await apiClient.post("/founder/analyze", payload);
    return data;
  } catch (e) { throw apiErr(e, "Unable to analyze your founder idea"); }
}
