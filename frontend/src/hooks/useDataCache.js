import { useCallback, useEffect, useState } from "react";
import { fetchWithSWR, getCached, setCached } from "../lib/client";

/**
 * Stale-while-revalidate data hook.
 * Cached data renders immediately; stale entries revalidate in the background.
 * Keys must include the authenticated user identity for any private response.
 */
export function useDataCache(key, fetcher, { enabled = true } = {}) {
  const [data, setData] = useState(() => key ? getCached(key) : null);
  const [loading, setLoading] = useState(Boolean(enabled && key && !getCached(key)));
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    if (!enabled || !key) {
      setData(null);
      setLoading(false);
      return undefined;
    }

    const cached = getCached(key);
    setData(cached);
    if (cached !== null) {
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError("");

    fetchWithSWR(key, fetcher, { force: revision > 0 })
      .then((next) => {
        if (active) setData(next);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load this data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [key, enabled, fetcher, revision]);

  const refresh = useCallback(() => {
    if (!enabled || !key) return;
    setLoading(getCached(key) === null);
    setRevision((current) => current + 1);
  }, [enabled, key]);

  const mutate = useCallback((updater) => {
    setData((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (key) setCached(key, next);
      return next;
    });
  }, [key]);

  return { data, loading, error, refresh, mutate };
}
