import { apiClient } from "../client";

export async function listNotificationsApi(params = {}) {
  const res = await apiClient.get("/api/notifications", { params });
  return res.data;
}

export async function markNotificationReadApi(id) {
  const res = await apiClient.patch(`/api/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsReadApi() {
  const res = await apiClient.patch("/api/notifications/read-all");
  return res.data;
}