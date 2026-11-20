import { apiClient } from "../client";

export async function listMarketplaceProvidersApi(params = {}) {
  const res = await apiClient.get("/api/marketplace/listings", { params });
  return res.data;
}

export async function getMarketplaceProviderApi(id) {
  const res = await apiClient.get(`/api/marketplace/listings/${id}`);
  return res.data;
}

export async function listMarketplaceListingsApi(params = {}) {
  const res = await apiClient.get("/marketplace/listings", { params });
  return res.data;
}

export async function getMarketplaceListingApi(id) {
  const res = await apiClient.get(`/marketplace/listings/${id}`);
  return res.data;
}

export async function createMarketplaceOrderApi(payload) {
  const res = await apiClient.post("/api/marketplace/orders", payload);
  return res.data;
}

export async function searchMarketplaceApi(query, params = {}) {
  const res = await apiClient.get("/api/search", { params: { q: query, ...params } });
  return res.data;
}