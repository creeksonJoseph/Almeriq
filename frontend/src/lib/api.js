/**
 * lib/api.js - thin axios client with SWR cache + request dedup & auth methods.
 *
 * Configured for production deployment with fallback to local development server.
 * withCredentials: true ensures HttpOnly cookies are automatically attached.
 */
import axios from "axios";

// ── Base Axios Instance ───────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ── SWR & Dedup Cache Storage ────────────────────────────────────────────────
const cache = new Map();      // key → { data, etag, ts }
const inFlight = new Map();   // key → Promise (dedup)
const TTL = 60_000;           // 60 s cache TTL

/**
 * Fetch helper using Axios with ETag / 304 support
 */
export async function apiFetch(url, { etag } = {}) {
  try {
    const headers = {};
    if (etag) headers["If-None-Match"] = etag;

    const response = await apiClient.get(url, {
      headers,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    });

    if (response.status === 304) return null;

    const newEtag = response.headers["etag"] || undefined;
    return { data: response.data, etag: newEtag };
  } catch (error) {
    const err = new Error(error.response?.data?.detail || error.message || `HTTP Error`);
    err.status = error.response?.status;
    throw err;
  }
}

export function getCached(key) {
  return cache.get(key)?.data ?? null;
}

export async function fetchWithSWR(key, fetcher) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  if (!inFlight.has(key)) {
    const p = fetcher(hit?.etag)
      .then((r) => {
        if (r) cache.set(key, { data: r.data, etag: r.etag, ts: Date.now() });
        return cache.get(key)?.data ?? null;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, p);
  }

  return inFlight.get(key);
}

export function invalidate(key) {
  cache.delete(key);
}

// ── Waitlist Mutation ────────────────────────────────────────────────────────
export async function postWaitlist(payload) {
  try {
    const response = await apiClient.post("/waitlist", payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message || "Failed to submit waitlist registration";
    const err = new Error(detail);
    err.status = error.response?.status;
    throw err;
  }
}

// ── Authentication & Onboarding API Methods ─────────────────────────────────

/**
 * Phase 1: Low-Friction Gate Sign Up
 */
export async function registerApi({ email, password }) {
  try {
    const response = await apiClient.post("/auth/register", { email, password });
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message || "Failed to register";
    const err = new Error(detail);
    err.status = error.response?.status;
    throw err;
  }
}

/**
 * Phase 1: Low-Friction Gate Login
 */
export async function loginApi({ email, password }) {
  try {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message || "Failed to log in";
    const err = new Error(detail);
    err.status = error.response?.status;
    throw err;
  }
}

/**
 * Phase 1: Google Social Authentication
 */
export async function googleAuthApi(credential) {
  try {
    const response = await apiClient.post("/auth/google", { credential });
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message || "Google authentication failed";
    const err = new Error(detail);
    err.status = error.response?.status;
    throw err;
  }
}

/**
 * Phase 2: Onboarding Wizard Step Update
 */
export async function onboardingApi(payload) {
  try {
    const response = await apiClient.post("/auth/onboarding", payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message || "Failed to save onboarding data";
    const err = new Error(detail);
    err.status = error.response?.status;
    throw err;
  }
}

/**
 * Get Current Authenticated User Session
 */
export async function getMeApi() {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Log out user & clear cookie
 */
export async function logoutApi() {
  try {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  } catch (error) {
    return null;
  }
}
