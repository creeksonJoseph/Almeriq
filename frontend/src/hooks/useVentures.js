import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { deleteVentureApi, getVenturesCachedApi } from "../lib/api/founder";
import { useDataCache } from "./useDataCache";

export function useVentures() {
  const { user } = useAuth();
  const cacheKey = user?.id ? `private:ventures:${user.id}` : null;
  const {
    data,
    loading,
    error,
    refresh,
    mutate,
  } = useDataCache(cacheKey, getVenturesCachedApi, { enabled: Boolean(user?.id) });

  const ventures = Array.isArray(data) ? data : data?.items || [];

  const remove = useCallback(async (id) => {
    await deleteVentureApi(id);
    mutate((current) => {
      const items = Array.isArray(current) ? current : current?.items || [];
      return items.filter((venture) => venture.id !== id);
    });
  }, [mutate]);

  return { ventures, loading, error, refresh, remove };
}
