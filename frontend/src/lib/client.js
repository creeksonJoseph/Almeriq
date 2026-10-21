/**
 * lib/client.js - shared Axios instance + error parser + SWR cache helpers.
 * withCredentials ensures HttpOnly cookies are automatically attached.
 */
import axios from "axios";

// ── Base Axios Instance ───────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Error Message Parser ──────────────────────────────────────────────────────
export function extractErrorMessage(error, defaultMsg = "An error occurred") {
  if (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT" ||
    (typeof error?.message === "string" && error.message.toLowerCase().includes("timeout"))
  ) {
    return "Request timed out. Please try again.";
  }
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(", ");
  }
  if (detail && typeof detail === "object") {
    if (detail.message) return detail.message;
    if (detail.error) return detail.error;
    try { return JSON.stringify(detail); } catch { /* ignore */ }
  }
  if (error.response?.data?.message) return error.response.data.message;
  return error.message || defaultMsg;
}

// ── SWR & Dedup Cache ─────────────────────────────────────────────────────────
const cache = new Map();    // key → { data, etag, ts }
const inFlight = new Map(); // key → Promise (dedup)
const TTL = 60_000;         // 60 s

export async function apiFetch(url, { etag } = {}) {
  try {
    const headers = {};
    if (etag) headers["If-None-Match"] = etag;
    const response = await apiClient.get(url, {
      headers,
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    if (response.status === 304) return null;
    return { data: response.data, etag: response.headers["etag"] ?? undefined };
  } catch (error) {
    const err = new Error(extractErrorMessage(error, "HTTP Error"));
    err.status = error.response?.status;
    err.detail = error.response?.data?.detail;
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
