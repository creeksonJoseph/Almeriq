import { useCallback, useState, useRef, useEffect } from "react";
import { z } from "zod";
import { analyzeFounderIdeaApi, saveBriefApi } from "../lib/api";

const FORM_KEY = "alimeriq_founder_form";
const ANALYSIS_KEY = "alimeriq_founder_analysis";
const VENTURE_ID_KEY = "alimeriq_venture_id";

export const INITIAL_FOUNDER_FORM = {
  idea: "",
  problem: "",
  solution: "",
  customer: "",
  location: "",
};

// Zod schema for response validation
const analysisResponseSchema = z.object({
  source: z.enum(["gemini", "local"]),
  summary: z.string().min(20).max(2000),
  market: z.string().min(20).max(2000),
  risks: z.array(z.string()).min(3).max(7),
  mvp: z.array(z.string()).min(3).max(7),
  roadmap: z.array(z.string()).min(3).max(8),
  next_steps: z.array(z.string()).min(3).max(8),
  venture_id: z.number().optional(),
});

function readSession(key, fallback) {
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readLocal(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeSession(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to write to sessionStorage:", e);
  }
}

function writeLocal(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to write to localStorage:", e);
  }
}

export function useFounderFlow() {
  const [form, setFormState] = useState(() => {
    const initial = readSession(FORM_KEY, INITIAL_FOUNDER_FORM);
    console.log("[useFounderFlow] Initialized form from sessionStorage", {
      hasData: initial !== INITIAL_FOUNDER_FORM,
      ideaLength: initial.idea?.length || 0,
    });
    return initial;
  });

  const [analysis, setAnalysisState] = useState(() => {
    const initial = readSession(ANALYSIS_KEY, null);
    console.log("[useFounderFlow] Initialized analysis from sessionStorage", {
      hasData: !!initial,
      source: initial?.source,
    });
    return initial;
  });

  const [ventureId, setVentureIdState] = useState(() => {
    const initial = readLocal(VENTURE_ID_KEY, null);
    console.log("[useFounderFlow] Initialized ventureId from localStorage", {
      ventureId: initial,
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever global active idea is changed
  useEffect(() => {
    const handleActiveIdeaChanged = (e) => {
      const detail = e.detail;
      if (detail?.brief) {
        setFormState(detail.brief);
      } else {
        const freshForm = readSession(FORM_KEY, INITIAL_FOUNDER_FORM);
        setFormState(freshForm);
      }
      if (detail?.ventureId !== undefined) {
        setVentureIdState(detail.ventureId);
      }
    };

    window.addEventListener("almeriq:active-idea-changed", handleActiveIdeaChanged);
    return () => {
      window.removeEventListener("almeriq:active-idea-changed", handleActiveIdeaChanged);
    };
  }, []);

  // Debounce timer refs
  const analyzeTimeoutRef = useRef(null);
  const formSyncTimeoutRef = useRef(null);

  const setForm = useCallback((value) => {
    setFormState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      writeSession(FORM_KEY, next);
      
      // Debounce form sync
      clearTimeout(formSyncTimeoutRef.current);
      formSyncTimeoutRef.current = setTimeout(() => {
        writeSession(FORM_KEY, next);
        console.log("[useFounderFlow] Form synced to sessionStorage", {
          ideaLength: next.idea?.length || 0,
        });
      }, 1000);
      
      return next;
    });
  }, []);

  const setAnalysis = useCallback((value) => {
    setAnalysisState(value);
    if (value) {
      writeSession(ANALYSIS_KEY, value);
      console.log("[useFounderFlow] Analysis saved to sessionStorage", {
        source: value.source,
        risksCount: value.risks?.length || 0,
      });
    } else {
      window.sessionStorage.removeItem(ANALYSIS_KEY);
      console.log("[useFounderFlow] Analysis cleared from sessionStorage");
    }
  }, []);

  const setVentureId = useCallback((id) => {
    setVentureIdState(id);
    if (id) {
      writeLocal(VENTURE_ID_KEY, id);
      console.log("[useFounderFlow] Venture ID saved to localStorage", { ventureId: id });
    } else {
      window.localStorage.removeItem(VENTURE_ID_KEY);
      console.log("[useFounderFlow] Venture ID cleared from localStorage");
    }
  }, []);

  const analyze = useCallback(async () => {
    setError("");
    setSaveSuccess(false);

    // Debounce rapid submissions
    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current);
      console.log("[useFounderFlow] Cleared previous analyze timeout (debounce)");
    }

    return new Promise((resolve, reject) => {
      analyzeTimeoutRef.current = setTimeout(async () => {
        const startTime = performance.now();
        console.log("[useFounderFlow] Starting analysis request", {
          ideaLength: form.idea?.length || 0,
          customerLength: form.customer?.length || 0,
        });

        setLoading(true);
        setError("");
        try {
          const result = await analyzeFounderIdeaApi(form);
          const elapsed = performance.now() - startTime;

          console.log("[useFounderFlow] API response received", {
            elapsedMs: Math.round(elapsed),
            source: result.source,
            risksCount: result.risks?.length || 0,
            ventureId: result.venture_id,
          });

          // Validate response against schema
          const validated = analysisResponseSchema.parse(result);
          console.log("[useFounderFlow] Response validation passed");

          setAnalysis(validated);
          if (validated.venture_id) {
            setVentureId(validated.venture_id);
            setSaveSuccess(true);
            console.log("[useFounderFlow] Venture saved successfully", {
              ventureId: validated.venture_id,
            });
          }
          resolve(validated);
        } catch (err) {
          const elapsed = performance.now() - startTime;
          console.error("[useFounderFlow] Analysis failed", {
            elapsedMs: Math.round(elapsed),
            errorType: err instanceof z.ZodError ? "ValidationError" : "APIError",
            errorMessage: err.message,
          });

          // Handle validation errors
          if (err instanceof z.ZodError) {
            const validationError = `Invalid analysis format: ${err.errors[0].message}`;
            console.error("[useFounderFlow] Validation error details", {
              errors: err.errors,
            });
            setError(validationError);
            reject(new Error(validationError));
          } else {
            // API error - already cleaned by backend
            const errorMsg = err.message || "Unable to analyze your idea right now.";
            console.error("[useFounderFlow] API error", { errorMsg });
            setError(errorMsg);
            reject(err);
          }
        } finally {
          setLoading(false);
        }
      }, 500); // 500ms debounce
    });
  }, [form, setAnalysis, setVentureId]);

  const resetFlow = useCallback(() => {
    console.log("[useFounderFlow] Resetting flow");
    setForm(INITIAL_FOUNDER_FORM);
    setAnalysis(null);
    setVentureId(null);
    setError("");
    setSaveSuccess(false);
    clearTimeout(analyzeTimeoutRef.current);
    clearTimeout(formSyncTimeoutRef.current);
    console.log("[useFounderFlow] Flow reset complete");
  }, [setForm, setAnalysis, setVentureId]);

  return {
    form,
    setForm,
    analysis,
    setAnalysis,
    ventureId,
    setVentureId,
    loading,
    error,
    saveSuccess,
    setSaveSuccess,
    analyze,
    resetFlow,
  };
}
