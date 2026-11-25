import { useCallback, useEffect, useState } from "react";
import { fetchWithSWR, getCached, setCached, subscribeCache } from "../lib/client";

/**
 * Stale-while-revalidate data hook.
 * Cached data renders immediately; stale entries revalidate in the background.
 * Keys must include the authenticated user identity for any private response.
 */
export function useDataCache(key, fetcher, { enabled = true } = {}) {
  const [data, setData] = useState(() => key ? getCached(key) : null);
  const [loading, setLoading] = useState(Boolean(enabled && key && !getCached(key)));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!enabled || !key) {
      setData(null);
      setLoading(false);
      return undefined;
    }

    const unsubscribe = subscribeCache(key, (next) => {
      if (active) setData(next);
    });
    const cached = getCached(key);
    setData(cached);
    if (cached !== null) {
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError("");

    fetchWithSWR(key, fetcher)
      .then((next) => {
        if (active) setData(next);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load this data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [key, enabled, fetcher]);

  const refresh = useCallback(async () => {
    if (!enabled || !key) return null;
    setLoading(getCached(key) === null);
    setError("");
    try {
      const next = await fetchWithSWR(key, fetcher, { force: true });
      setData(next);
      return next;
    } catch (requestError) {
      setError(requestError.message || "Unable to refresh this data.");
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [enabled, key, fetcher]);

  const mutate = useCallback((updater) => {
    setData((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (key) setCached(key, next);
      return next;
    });
  }, [key]);

  return { data, loading, error, refresh, mutate };
}
