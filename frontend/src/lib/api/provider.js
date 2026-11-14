import { apiClient } from "../client";

export async function getProviderProfileApi() {
  const res = await apiClient.get("/api/provider/profile");
  return res.data;
}

export async function updateProviderProfileApi(payload) {
  const res = await apiClient.put("/api/provider/profile", payload);
  return res.data;
}

export async function listAssetsApi(params = {}) {
  const res = await apiClient.get("/api/provider/assets", { params });
  return res.data;
}

export async function getAssetApi(id) {
  const res = await apiClient.get(`/api/provider/assets/${id}`);
  return res.data;
}

export async function createAssetApi(payload) {
  const res = await apiClient.post("/api/provider/assets", payload);
  return res.data;
}

export async function updateAssetApi(id, payload) {
  const res = await apiClient.put(`/api/provider/assets/${id}`, payload);
  return res.data;
}

export async function deleteAssetApi(id) {
  const res = await apiClient.delete(`/api/provider/assets/${id}`);
  return res.data;
}

export async function listCoverageRegionsApi() {
  const res = await apiClient.get("/api/provider/coverage-regions");
  return res.data;
}

export async function updateCoverageRegionsApi(regions) {
  const res = await apiClient.put("/api/provider/coverage-regions", { regions });
  return res.data;
}