/**
 * lib/api/waitlist.js - Waitlist API calls.
 */
import { apiClient, extractErrorMessage } from "../client";

function apiErr(error, msg) {
  const err = new Error(extractErrorMessage(error, msg));
  err.status = error.response?.status;
  err.detail = error.response?.data?.detail;
  return err;
}

export async function postWaitlist(payload) {
  try {
    const { data } = await apiClient.post("/waitlist", payload);
    return data;
  } catch (e) { throw apiErr(e, "Failed to submit waitlist registration"); }
}

export async function putWaitlist(payload) {
  try {
    const { data } = await apiClient.put("/waitlist", payload);
    return data;
  } catch (e) { throw apiErr(e, "Failed to update waitlist details"); }
}
