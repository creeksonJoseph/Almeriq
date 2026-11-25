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

export async function updateAdminRoleApi(role) {
  try {
    const { data } = await apiClient.patch("/admin/me/role", { role });
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to update your role");
  }
}


export async function getAdminProvidersApi() {
  try {
    const { data } = await apiClient.get("/admin/providers");
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to load provider verification queue");
  }
}

export async function updateAdminProviderVerificationApi(providerId, verified) {
  try {
    const { data } = await apiClient.patch(`/admin/providers/${encodeURIComponent(providerId)}/verification`, { verified });
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to update provider verification");
  }
}

export async function getAdminProviderVerificationHistoryApi(providerId) {
  try {
    const { data } = await apiClient.get(
      `/admin/providers/${encodeURIComponent(providerId)}/verification-history`
    );
    return data;
  } catch (e) {
    throw apiErr(e, "Unable to load provider verification history");
  }
}
