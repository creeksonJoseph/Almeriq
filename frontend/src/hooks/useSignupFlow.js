import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function useSignupFlow() {
  const { signupSendOtp, signupVerifyOtp, signupComplete, googleLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const clearError = useCallback(() => setError(""), []);

  const handleSendOtp = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signupSendOtp(email.trim().toLowerCase());
      setStep(2);
      startCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, signupSendOtp, startCountdown]);

  const handleResendOtp = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await signupSendOtp(email.trim().toLowerCase());
      startCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, signupSendOtp, startCountdown]);

  const handleVerifyOtp = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = await signupVerifyOtp(email.trim().toLowerCase(), otp.trim());
      setSignupToken(token);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, otp, signupVerifyOtp]);

  const handleComplete = useCallback(async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      const user = await signupComplete(signupToken, password);
      toast.success("Account created! Welcome to Alimeriq.");
      navigate(user.onboarding_completed ? "/dashboard" : "/dashboard");
    } catch (err) {
      if (err.status === 409) {
        toast.info("Account already created. Please sign in.");
        navigate("/login");
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, signupToken, signupComplete, navigate]);

  const handleGoogleSuccess = useCallback(async (credential) => {
    setLoading(true);
    setError("");
    try {
      const user = await googleLogin(credential);
      toast.success("Signed in with Google!");
      navigate(user.onboarding_completed ? "/dashboard" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [googleLogin, navigate]);

  const resetToEmail = useCallback(() => {
    setStep(1);
    setOtp("");
    setError("");
    clearInterval(timerRef.current);
  }, []);

  return {
    step,
    email, setEmail,
    otp, setOtp,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPassword, setShowPassword,
    loading, error, countdown,
    clearError,
    handleSendOtp,
    handleResendOtp,
    handleVerifyOtp,
    handleComplete,
    handleGoogleSuccess,
    resetToEmail,
  };
}
