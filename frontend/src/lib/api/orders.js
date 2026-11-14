import { apiClient } from "../client";

export async function listOrdersApi(params = {}) {
  const res = await apiClient.get("/api/provider/orders", { params });
  return res.data;
}

export async function getOrderApi(id) {
  const res = await apiClient.get(`/api/provider/orders/${id}`);
  return res.data;
}

export async function confirmOrderApi(id) {
  const res = await apiClient.patch(`/api/provider/orders/${id}/status`, { status: "confirmed" });
  return res.data;
}

export async function declineOrderApi(id, reason) {
  const res = await apiClient.patch(`/api/provider/orders/${id}/status`, { status: "declined", reason });
  return res.data;
}

export async function shipOrderApi(id, payload) {
  const res = await apiClient.post(`/api/provider/orders/${id}/waybill`, payload);
  return res.data;
}

export async function updateOrderStatusApi(id, status) {
  const res = await apiClient.patch(`/api/provider/orders/${id}/status`, { status });
  return res.data;
}

export async function uploadWaybillApi(id, payload) {
  const res = await apiClient.post(`/api/provider/orders/${id}/waybill`, payload);
  return res.data;
}

export async function getWaybillApi(id) {
  const res = await apiClient.get(`/api/provider/orders/${id}/waybill`);
  return res.data;
}