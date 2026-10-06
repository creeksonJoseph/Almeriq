/**
 * lib/api.js - thin axios client with SWR cache + request dedup (§10).
 *
 * Configured for production deployment at https://api.alimeriq.app
 * with fallback to local development server.
 */
import axios from "axios";

// ── Base Axios Instance ───────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE,
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

// ── Waitlist POST Mutation ────────────────────────────────────────────────────
/**
 * Submit waitlist registration using Axios
 * @param {{ full_name: string, email: string, role: string }} payload
 */
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
