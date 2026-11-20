import { apiClient } from "../client";

const normalizeOrder = (order) => ({
  ...order,
  clientName: order.client_name || order.client_email || "Client",
  assetName: order.asset_name || "Asset listing",
  assetDetails: order.asset_details || order.asset_category || "",
  amount: order.lease_amount,
  providerLocation: order.provider_location,
  telemetryUrl: order.asset_telemetry_url,
  paymentStatus: order.payment_status,
  paymentMethod: order.payment_method,
});

const normalizeOrderList = (data) => ({
  ...data,
  items: (data.items || []).map(normalizeOrder),
});

export async function listOrdersApi(params = {}) {
  const res = await apiClient.get("/api/provider/orders", { params });
  return normalizeOrderList(res.data);
}

export async function getOrderApi(id) {
  const res = await apiClient.get(`/api/provider/orders/${id}`);
  return normalizeOrder(res.data);
}

export async function confirmOrderApi(id) {
  const res = await apiClient.patch(`/api/provider/orders/${id}/status`, { status: "confirmed" });
  return normalizeOrder(res.data);
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
  return normalizeOrder(res.data);
}

export async function dispatchOrderApi(id, payload) {
  const res = await apiClient.post(`/api/provider/orders/${id}/dispatch`, payload);
  return normalizeOrder(res.data);
}

export async function uploadWaybillApi(id, payload) {
  const res = await apiClient.post(`/api/provider/orders/${id}/waybill`, payload);
  return res.data;
}

export async function getWaybillApi(id) {
  const res = await apiClient.get(`/api/provider/orders/${id}/waybill`);
  return res.data;
}