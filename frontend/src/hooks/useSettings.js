import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { sendChangeOtpApi, changePasswordApi } from "../lib/api";

export function useSettings() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Multi-step password change:
  // 1: Request OTP screen -> 2: OTP Verification screen -> 3: New Password screen
  const [pwdStep, setPwdStep] = useState(1);
  const [pwdForm, setPwdForm] = useState({ otp: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdCountdown, setPwdCountdown] = useState(0);
  const pwdTimerRef = useRef(null);

  const startPwdCountdown = useCallback((seconds = 60) => {
    clearInterval(pwdTimerRef.current);
    setPwdCountdown(seconds);
    pwdTimerRef.current = setInterval(() => {
      setPwdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(pwdTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(pwdTimerRef.current), []);

  // Step 1 -> Step 2: Request verification OTP code
  const handleRequestChangeOtp = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setPwdError("");
      setPwdSuccess("");
      setPwdLoading(true);
      try {
        await sendChangeOtpApi();
        setPwdStep(2);
        startPwdCountdown(60);
        showToast("Verification code sent to your email!", "info");
      } catch (err) {
        setPwdError(err.message || "Failed to send code");
        showToast(err.message || "Failed to send code", "error");
      } finally {
        setPwdLoading(false);
      }
    },
    [startPwdCountdown, showToast]
  );

  // Step 2 -> Step 3: Verify OTP code
  const handleVerifyOtp = useCallback(
    (e) => {
      if (e) e.preventDefault();
      setPwdError("");
      if (!pwdForm.otp || pwdForm.otp.trim().length !== 6) {
        setPwdError("Please enter a valid 6-digit code");
        return;
      }
      setPwdStep(3);
    },
    [pwdForm.otp]
  );

  // Resend OTP code
  const handleResendOtp = useCallback(async () => {
    setPwdError("");
    setPwdLoading(true);
    try {
      await sendChangeOtpApi();
      startPwdCountdown(60);
      showToast("New verification code sent!", "info");
    } catch (err) {
      setPwdError(err.message || "Failed to resend code");
      showToast(err.message || "Failed to resend code", "error");
    } finally {
      setPwdLoading(false);
    }
  }, [startPwdCountdown, showToast]);

  // Step 3: Update password
  const handleChangePassword = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setPwdError("");
      setPwdSuccess("");

      if (pwdForm.next !== pwdForm.confirm) {
        setPwdError("Passwords do not match");
        return;
      }
      if (pwdForm.next.length < 8) {
        setPwdError("Password must be at least 8 characters");
        return;
      }

      setPwdLoading(true);
      try {
        await changePasswordApi({
          otp: pwdForm.otp.trim(),
          new_password: pwdForm.next,
        });

        showToast("Password changed successfully!", "success");
        setPwdSuccess("Password changed successfully!");
        setPwdForm({ otp: "", next: "", confirm: "" });
        setPwdStep(1);
      } catch (err) {
        setPwdError(err.message || "Failed to change password");
        showToast(err.message || "Failed to change password", "error");
      } finally {
        setPwdLoading(false);
      }
    },
    [pwdForm, showToast]
  );

  return {
    user,
    pwdStep,
    setPwdStep,
    pwdForm,
    setPwdForm,
    showPwd,
    setShowPwd,
    showConfirmPwd,
    setShowConfirmPwd,
    pwdLoading,
    pwdError,
    setPwdError,
    pwdSuccess,
    pwdCountdown,
    handleRequestChangeOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleChangePassword,
  };
}
