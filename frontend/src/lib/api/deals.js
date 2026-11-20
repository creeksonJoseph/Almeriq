import { apiClient } from "../client";

export async function createDealApi(payload) {
  const res = await apiClient.post("/deals", payload);
  return res.data;
}

export async function getDealApi(id) {
  const res = await apiClient.get(`/deals/${id}`);
  return res.data;
}

export async function signDealApi(id, signature, terms = {}) {
  const res = await apiClient.post(`/deals/${id}/sign`, { signature, ...terms });
  return res.data;
}