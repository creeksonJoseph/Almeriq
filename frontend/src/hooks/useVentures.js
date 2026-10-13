/**
 * hooks/useVentures.js - Fetch, cache and manage the founder's venture history.
 *
 * Ventures are fetched from the server and also mirrored in localStorage so
 * the list loads instantly on revisit even before the network responds.
 */
import { useCallback, useEffect, useState } from "react";
import { deleteVentureApi, listVenturesApi } from "../lib/api";

const LS_KEY = "alimeriq_ventures_cache";

function readCache() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(ventures) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ventures));
  } catch { /* quota exceeded — silent */ }
}

export function useVentures() {
  const [ventures, setVentures] = useState(() => readCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listVenturesApi();
      setVentures(data);
      writeCache(data);
    } catch (err) {
      setError(err.message || "Failed to load ventures.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { refresh(); }, [refresh]);

  const remove = useCallback(async (id) => {
    await deleteVentureApi(id);
    setVentures((prev) => {
      const next = prev.filter((v) => v.id !== id);
      writeCache(next);
      return next;
    });
  }, []);

  return { ventures, loading, error, refresh, remove };
}
