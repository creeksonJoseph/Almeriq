/**
 * hooks/useOnboarding.js - Custom hook for Phase 2 Onboarding Wizard logic.
 *
 * Separates multi-step form state, validation, and API updates from presentational UI.
 */
import { useState, useCallback } from "react";
import { onboardingApi } from "../lib/api";
import { useToast } from "../context/ToastContext";

export function useOnboarding(user, onComplete) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [nationality, setNationality] = useState(user?.nationality || "United States");
  const [idNumber, setIdNumber] = useState(user?.id_number || "");
  const [role, setRole] = useState(user?.role !== "user" ? user?.role : "FOUNDER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextStep1 = useCallback(async (e) => {
    e?.preventDefault();
    if (loading) return;
    const cleanName = fullName.trim().replace(/\s+/g, " ");
    if (!cleanName || cleanName.length < 2) {
      setError("Please enter your full legal name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onboardingApi({ full_name: cleanName, nationality });
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to save personal details.");
    } finally {
      setLoading(false);
    }
  }, [fullName, nationality, loading]);

  const nextStep2 = useCallback(async (e) => {
    e?.preventDefault();
    if (loading) return;
    const cleanId = idNumber.trim();
    if (!cleanId) {
      setError("Please enter your ID or Passport number for verification.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onboardingApi({ id_number: cleanId });
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to save identity verification.");
    } finally {
      setLoading(false);
    }
  }, [idNumber, loading]);

  const completeSetup = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await onboardingApi({
        full_name: fullName.trim().replace(/\s+/g, " "),
        nationality,
        id_number: idNumber.trim(),
        role,
      });
      toast.success("Setup complete! Welcome to Alimeriq.");
      if (onComplete) {
        onComplete(res.user);
      }
    } catch (err) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  }, [fullName, nationality, idNumber, role, onComplete, loading]);

  return {
    step,
    setStep,
    fullName,
    setFullName,
    nationality,
    setNationality,
    idNumber,
    setIdNumber,
    role,
    setRole,
    loading,
    error,
    setError,
    nextStep1,
    nextStep2,
    completeSetup,
  };
}
