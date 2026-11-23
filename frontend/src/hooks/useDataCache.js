import { useEffect, useState } from "react";
import { fetchWithSWR, getCached } from "../lib/client";

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
      setLoading(false);
      return undefined;
    }

    const cached = getCached(key);
    if (cached !== null) {
      setData(cached);
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

    return () => { active = false; };
  }, [key, enabled, fetcher]);

  return { data, loading, error };
}
