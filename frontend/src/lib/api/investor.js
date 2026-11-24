/**
 * lib/api/investor.js - Investor Portal API client.
 *
 * Covers investor profile, startup browse, founder interest requests and portfolio.
 */
import { apiClient, extractErrorMessage } from "../client";

function apiErr(error, msg) {
  const err = new Error(extractErrorMessage(error, msg));
  err.status = error.response?.status;
  err.detail = error.response?.data?.detail;
  return err;
}

// ── Investor Profile ───────────────────────────────────────────────────────────

export async function getInvestorProfileApi() {
  try {
    const { data } = await apiClient.get("/api/investor/profile");
    return data;
  } catch (e) {
    if (e?.response?.status === 404) return null;
    throw apiErr(e, "Failed to load investor profile");
  }
}

export async function updateInvestorProfileApi(payload) {
  try {
    const { data } = await apiClient.put("/api/investor/profile", payload);
    return data;
  } catch (e) {
    throw apiErr(e, "Failed to save investor profile");
  }
}

// ── Startup Browse ─────────────────────────────────────────────────────────────

export async function listInvestorStartupsApi(params = {}) {
  try {
    const { data } = await apiClient.get("/api/investor/startups", { params });
    return data;
  } catch (e) {
    throw apiErr(e, "Failed to load startups");
  }
}

export async function getInvestorStartupApi(id) {
  try {
    const { data } = await apiClient.get(`/api/investor/startups/${id}`);
    return data;
  } catch (e) {
    throw apiErr(e, "Failed to load startup");
  }
}

// ── Founder interest requests ─────────────────────────────────────────────────

export async function createInvestmentApi(payload) {
  try {
    const { data } = await apiClient.post("/api/investor/investments", payload);
    return data;
  } catch (e) {
    throw apiErr(e, "Failed to send founder interest request");
  }
}

// ── Portfolio ──────────────────────────────────────────────────────────────────

export async function listInvestorPortfolioApi(params = {}) {
  try {
    const { data } = await apiClient.get("/api/investor/portfolio", { params });
    return data;
  } catch (e) {
    throw apiErr(e, "Failed to load portfolio");
  }
}

export async function getInvestorPortfolioItemApi(id) {
  try {
    const { data } = await apiClient.get(`/api/investor/portfolio/${id}`);
    return data;
  } catch (e) {
    throw apiErr(e, "Failed to load portfolio item");
  }
}
export async function updateInvestorPortfolioApi(id, payload) {
  try {
    const { data } = await apiClient.patch(`/api/investor/portfolio/${id}`, payload);
    return data;
  } catch (e) {
    throw apiErr(e, "Failed to update portfolio tracking");
  }
}


export async function listInvestorUpdatesApi() {
  try {
    const { data } = await apiClient.get("/api/investor/updates");
    return data;
  } catch (e) {
    throw apiErr(e, "Failed to load investor updates");
  }
}
