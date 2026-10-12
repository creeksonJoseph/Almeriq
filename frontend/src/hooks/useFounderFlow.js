import { useCallback, useState } from "react";
import { analyzeFounderIdeaApi } from "../lib/api";

const FORM_KEY = "alimeriq_founder_form";
const ANALYSIS_KEY = "alimeriq_founder_analysis";

export const INITIAL_FOUNDER_FORM = {
  idea: "",
  problem: "",
  solution: "",
  customer: "",
  location: "",
};

function readSession(key, fallback) {
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeSession(key, value) {
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function useFounderFlow() {
  const [form, setFormState] = useState(() =>
    readSession(FORM_KEY, INITIAL_FOUNDER_FORM),
  );
  const [analysis, setAnalysisState] = useState(() =>
    readSession(ANALYSIS_KEY, null),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setForm = useCallback((value) => {
    setFormState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      writeSession(FORM_KEY, next);
      return next;
    });
  }, []);

  const setAnalysis = useCallback((value) => {
    setAnalysisState(value);
    if (value) writeSession(ANALYSIS_KEY, value);
    else window.sessionStorage.removeItem(ANALYSIS_KEY);
  }, []);

  const analyze = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const result = await analyzeFounderIdeaApi(form);
      setAnalysis(result);
      return result;
    } catch (err) {
      setError(err.message || "Unable to analyze your idea right now.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [form, setAnalysis]);

  return {
    form,
    setForm,
    analysis,
    setAnalysis,
    loading,
    error,
    analyze,
  };
}
