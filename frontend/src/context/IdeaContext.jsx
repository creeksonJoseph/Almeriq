/**
 * context/IdeaContext.jsx - Global active startup idea / venture state.
 *
 * Provides a unified source of truth for the currently active idea across
 * Founder Studio tools (Idea Validation, Startup Tools, Product & Tech, Legal, Outreach, Analysis).
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { listVenturesApi } from "../lib/api";
import { useAuth } from "./AuthContext";

const LS_ACTIVE_VENTURE_KEY = "almeriq_active_venture_id";
const SS_FORM_KEY = "alimeriq_founder_form";
const LS_VENTURE_ID_KEY = "alimeriq_venture_id";
const LS_VENTURES_CACHE_KEY = "alimeriq_ventures_cache";

const IdeaContext = createContext(null);

export function IdeaProvider({ children }) {
  const { user } = useAuth();
  const [ventures, setVentures] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_VENTURES_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [activeVentureId, setActiveVentureIdState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_ACTIVE_VENTURE_KEY) || localStorage.getItem(LS_VENTURE_ID_KEY);
      return saved ? String(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync active venture data into localStorage and notify listeners
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

      // Defer event dispatch to avoid updating other components synchronously during render
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("almeriq:active-idea-changed", {
            detail: { ...venture, brief: briefForm, ventureId: venture.id },
          })
        );
      }, 0);
    } catch (e) {
      console.warn("[IdeaContext] Storage sync error:", e);
    }
  }, []);

  const refreshVentures = useCallback(async () => {
    if (!user) return [];
    setLoading(true);
    try {
      const data = await listVenturesApi();
      if (Array.isArray(data)) {
        setVentures(data);
        try {
          localStorage.setItem(LS_VENTURES_CACHE_KEY, JSON.stringify(data));
        } catch {}

        // Determine active venture cleanly outside of state updater
        const currentId = activeVentureId;
        const exists = data.some((v) => String(v.id) === String(currentId));
        if (!exists && data.length > 0) {
          const defaultVenture = data[0];
          setActiveVentureIdState(String(defaultVenture.id));
          syncFlowStorage(defaultVenture);
        } else if (exists) {
          const found = data.find((v) => String(v.id) === String(currentId));
          if (found) syncFlowStorage(found);
        }
        return data;
      }
      return [];
    } catch (err) {
      console.warn("[IdeaContext] Failed to load ventures:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, activeVentureId, syncFlowStorage]);

  // Load ventures whenever authenticated user changes
  useEffect(() => {
    if (user) {
      refreshVentures();
    } else {
      setVentures([]);
      setActiveVentureIdState(null);
    }
  }, [user, refreshVentures]);

  const setActiveVentureId = useCallback((id) => {
    const stringId = id ? String(id) : null;
    setActiveVentureIdState(stringId);
    if (stringId) {
      try {
        localStorage.setItem(LS_ACTIVE_VENTURE_KEY, stringId);
        localStorage.setItem(LS_VENTURE_ID_KEY, stringId);
      } catch {}
      const found = ventures.find((v) => String(v.id) === stringId);
      if (found) {
        syncFlowStorage(found);
      }
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
    if (!ventures?.length) return null;
    if (!activeVentureId) return ventures[0] || null;
    return ventures.find((v) => String(v.id) === String(activeVentureId)) || ventures[0] || null;
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
