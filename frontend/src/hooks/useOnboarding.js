/**
 * hooks/useOnboarding.js - Custom hook for Phase 2 Onboarding Wizard logic.
 *
 * Separates multi-step form state, validation, and API updates from presentational UI.
 */
import { useState, useCallback } from "react";
import { onboardingApi } from "../lib/api";

export function useOnboarding(user, onComplete) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [nationality, setNationality] = useState(user?.nationality || "United States");
  const [idNumber, setIdNumber] = useState(user?.id_number || "");
  const [role, setRole] = useState(user?.role !== "user" ? user?.role : "founder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextStep1 = useCallback(async (e) => {
    e?.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your full legal name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onboardingApi({ full_name: fullName, nationality });
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to save personal details.");
    } finally {
      setLoading(false);
    }
  }, [fullName, nationality]);

  const nextStep2 = useCallback(async (e) => {
    e?.preventDefault();
    if (!idNumber.trim()) {
      setError("Please enter your ID or Passport number for verification.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onboardingApi({ id_number: idNumber });
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to save identity verification.");
    } finally {
      setLoading(false);
    }
  }, [idNumber]);

  const completeSetup = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await onboardingApi({
        full_name: fullName,
        nationality,
        id_number: idNumber,
        role,
      });
      if (onComplete) {
        onComplete(res.user);
      }
    } catch (err) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  }, [fullName, nationality, idNumber, role, onComplete]);

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
