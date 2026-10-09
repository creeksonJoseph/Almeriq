import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordApi, resetPasswordApi } from "../lib/api";
import { useToast } from "../context/ToastContext";

export function usePasswordReset() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ otp: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const startCountdown = useCallback((seconds = 60) => {
    clearInterval(timerRef.current);
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSendOtp = useCallback(async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await forgotPasswordApi(email.trim().toLowerCase());
      setStep(2);
      startCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, startCountdown]);

  const handleResendOtp = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await forgotPasswordApi(email.trim().toLowerCase());
      startCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, startCountdown]);

  const handleReset = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    try {
      await resetPasswordApi(email.trim().toLowerCase(), form.otp.trim(), form.password);
      toast.success("Password reset! Sign in with your new password.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, form, navigate, toast]);

  return {
    step, setStep,
    email, setEmail,
    form, setForm,
    showPwd, setShowPwd,
    loading, error, setError,
    countdown,
    handleSendOtp,
    handleResendOtp,
    handleReset,
  };
}
