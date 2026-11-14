import { apiClient } from "../client";

export async function getProviderProfileApi() {
  const res = await apiClient.get("/providers/profile");
  return res.data;
}

export async function updateProviderProfileApi(payload) {
  const res = await apiClient.put("/providers/profile", payload);
  return res.data;
}

export async function listAssetsApi(params = {}) {
  const res = await apiClient.get("/providers/assets", { params });
  return res.data;
}

export async function getAssetApi(id) {
  const res = await apiClient.get(`/providers/assets/${id}`);
  return res.data;
}

export async function createAssetApi(payload) {
  const res = await apiClient.post("/providers/assets", payload);
  return res.data;
}

export async function updateAssetApi(id, payload) {
  const res = await apiClient.put(`/providers/assets/${id}`, payload);
  return res.data;
}

export async function deleteAssetApi(id) {
  const res = await apiClient.delete(`/providers/assets/${id}`);
  return res.data;
}

export async function listCoverageRegionsApi() {
  const res = await apiClient.get("/providers/coverage-regions");
  return res.data;
}

export async function updateCoverageRegionsApi(regions) {
  const res = await apiClient.put("/providers/coverage-regions", { regions });
  return res.data;
}