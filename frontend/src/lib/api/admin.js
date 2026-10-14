/**
 * lib/api/admin.js - Admin operations API client.
 */
import { apiClient, extractErrorMessage } from "../client";

function apiErr(error, defaultMsg) {
  const backendMsg = error.response?.data?.detail;
  const msg = backendMsg || extractErrorMessage(error, defaultMsg);
  const err = new Error(msg);
  err.status = error.response?.status;
  err.detail = error.response?.data?.detail;
  return err;
}

export async function getAdminWaitlistApi() {
  try {
    const { data } = await apiClient.get("/admin/waitlist");
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to load waitlist participants");
  }
}
