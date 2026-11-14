import { apiClient } from "../client";

export async function listOrdersApi(params = {}) {
  const res = await apiClient.get("/orders", { params });
  return res.data;
}

export async function getOrderApi(id) {
  const res = await apiClient.get(`/orders/${id}`);
  return res.data;
}

export async function confirmOrderApi(id) {
  const res = await apiClient.post(`/orders/${id}/confirm`);
  return res.data;
}

export async function declineOrderApi(id, reason) {
  const res = await apiClient.post(`/orders/${id}/decline`, { reason });
  return res.data;
}

export async function shipOrderApi(id, payload) {
  const res = await apiClient.post(`/orders/${id}/ship`, payload);
  return res.data;
}

export async function getWaybillApi(id) {
  const res = await apiClient.get(`/orders/${id}/waybill`);
  return res.data;
}