/**
 * context/IdeaContext.jsx - Global active startup idea / venture state.
 *
 * Uses the same user-scoped SWR cache as useVentures so Founder Studio pages
 * share one in-memory source of truth without persisting private ventures in
 * a cross-account localStorage entry.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { getVenturesCachedApi } from "../lib/api/founder";
import { useDataCache } from "../hooks/useDataCache";

const LS_ACTIVE_VENTURE_KEY = "almeriq_active_venture_id";
const SS_FORM_KEY = "alimeriq_founder_form";
const LS_VENTURE_ID_KEY = "alimeriq_venture_id";

const IdeaContext = createContext(null);

export function IdeaProvider({ children }) {
  const { user } = useAuth();
  const isFounder = user?.role === "founder";
  const cacheKey = isFounder && user?.id ? `private:ventures:${user.id}` : null;
  const {
    data,
    loading,
    refresh: refreshCachedVentures,
  } = useDataCache(cacheKey, getVenturesCachedApi, { enabled: Boolean(cacheKey) });
  const ventures = Array.isArray(data) ? data : [];

  const [activeVentureId, setActiveVentureIdState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_ACTIVE_VENTURE_KEY) || localStorage.getItem(LS_VENTURE_ID_KEY);
      return saved ? String(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync active venture data into localStorage and notify listeners.
  const syncFlowStorage = useCallback((venture) => {
    if (!venture) return;
    try {
      localStorage.setItem(LS_ACTIVE_VENTURE_KEY, String(venture.id));
      localStorage.setItem(LS_VENTURE_ID_KEY, String(venture.id));

      const briefForm = {
        name: venture.name || "",
        idea: venture.idea || "",
        problem: venture.problem || "",
        solution: venture.solution || "",
        customer: venture.customer || "",
        location: venture.location || "",
      };

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("almeriq:active-idea-changed", {
            detail: { ...venture, brief: briefForm, ventureId: venture.id },
          })
        );
      }, 0);
    } catch (error) {
      console.warn("[IdeaContext] Storage sync error:", error);
    }
  }, []);

  const refreshVentures = useCallback(async () => {
    if (!isFounder) return [];
    try {
      const refreshed = await refreshCachedVentures();
      return Array.isArray(refreshed) ? refreshed : [];
    } catch (error) {
      console.warn("[IdeaContext] Failed to load ventures:", error);
      return [];
    }
  }, [isFounder, refreshCachedVentures]);

  // Reset the active selection for non-founder sessions.
  useEffect(() => {
    if (!isFounder) setActiveVentureIdState(null);
  }, [isFounder]);

  // Keep the active selection valid whenever the shared venture cache changes.
  useEffect(() => {
    if (!isFounder || !Array.isArray(data)) return;

    const exists = data.some((venture) => String(venture.id) === String(activeVentureId));
    if (!exists && data.length > 0) {
      const defaultVenture = data[0];
      setActiveVentureIdState(String(defaultVenture.id));
      syncFlowStorage(defaultVenture);
    } else if (exists) {
      const found = data.find((venture) => String(venture.id) === String(activeVentureId));
      if (found) syncFlowStorage(found);
    }
  }, [isFounder, data, activeVentureId, syncFlowStorage]);

  const setActiveVentureId = useCallback((id) => {
    const stringId = id ? String(id) : null;
    setActiveVentureIdState(stringId);
    if (stringId) {
      try {
        localStorage.setItem(LS_ACTIVE_VENTURE_KEY, stringId);
        localStorage.setItem(LS_VENTURE_ID_KEY, stringId);
      } catch {}
      const found = ventures.find((venture) => String(venture.id) === stringId);
      if (found) syncFlowStorage(found);
    } else {
      try {
        localStorage.removeItem(LS_ACTIVE_VENTURE_KEY);
        localStorage.removeItem(LS_VENTURE_ID_KEY);
      } catch {}
    }
  }, [ventures, syncFlowStorage]);

  const selectVenture = useCallback((venture) => {
    if (!venture?.id) return;
    setActiveVentureId(venture.id);
    syncFlowStorage(venture);
  }, [setActiveVentureId, syncFlowStorage]);

  const clearActiveVenture = useCallback(() => {
    setActiveVentureIdState(null);
    try {
      localStorage.removeItem(LS_ACTIVE_VENTURE_KEY);
      localStorage.removeItem(LS_VENTURE_ID_KEY);
    } catch {}
  }, []);

  const activeVenture = useMemo(() => {
    if (!ventures.length) return null;
    if (!activeVentureId) return ventures[0] || null;
    return ventures.find((venture) => String(venture.id) === String(activeVentureId)) || ventures[0] || null;
  }, [ventures, activeVentureId]);

  const value = useMemo(() => ({
    ventures,
    activeVenture,
    activeVentureId: activeVenture ? String(activeVenture.id) : null,
    loadingVentures: loading,
    setActiveVentureId,
    selectVenture,
    refreshVentures,
    clearActiveVenture,
  }), [ventures, activeVenture, loading, setActiveVentureId, selectVenture, refreshVentures, clearActiveVenture]);

  return (
    <IdeaContext.Provider value={value}>
      {children}
    </IdeaContext.Provider>
  );
}

export function useActiveIdea() {
  const ctx = useContext(IdeaContext);
  if (!ctx) {
    throw new Error("useActiveIdea must be used within an IdeaProvider");
  }
  return ctx;
}
