/**
 * hooks/useWaitlist.js - stateful logic for the waitlist form.
 *
 * Separates data-fetching / mutation logic from the presentational component.
 * Draft autosave: persists in-progress form to localStorage (§13).
 * OTP verification required before updating details to prevent unauthorized changes.
 */
import { useState, useCallback, useEffect } from "react";
import { postWaitlist, putWaitlist, requestOTP, verifyOTP } from "../lib/api";

const DRAFT_KEY = "alimeriq_waitlist_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { full_name: "", email: "", role: "" };
    const parsed = JSON.parse(raw);
    return {
      full_name: parsed.full_name ? parsed.full_name.trim() : "",
      email: parsed.email ? parsed.email.trim().toLowerCase().replace(/\s+/g, "") : "",
      role: parsed.role || "",
    };
  } catch {
    return { full_name: "", email: "", role: "" };
  }
}

function saveDraft(draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* quota */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

export function useWaitlist() {
  const [form, setForm] = useState(loadDraft);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");
  // idle|loading|success|already_registered|conflict_prompt|edit_mode|otp_sending|otp_pending|otp_verifying|updating|updated|error
  const [serverError, setServerError] = useState("");
  const [existingUser, setExistingUser] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);
  const [verificationToken, setVerificationToken] = useState(null);
  const [targetAction, setTargetAction] = useState("edit"); // "edit" | "conflict_apply"

  // §13 - draft autosave on every change (debounced at 500ms)
  useEffect(() => {
    if (status === "success" || status === "updated") return;
    const t = setTimeout(() => saveDraft(form), 500);
    return () => clearTimeout(t);
  }, [form, status]);

  // OTP resend countdown
  useEffect(() => {
    if (otpResendCountdown <= 0) return;
    const timer = setTimeout(() => setOtpResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpResendCountdown]);

  const setField = useCallback(
    (key) => (e) => {
      let val = e.target.value;
      if (key === "email") {
        val = val.toLowerCase().replace(/\s+/g, "");
      }
      setForm((f) => ({ ...f, [key]: val }));
    },
    []
  );

  const setRole = useCallback(
    (role) => setForm((f) => ({ ...f, role: f.role === role ? "" : role })),
    []
  );

  const blur = useCallback(
    (key) => () => {
      setTouched((t) => ({ ...t, [key]: true }));
      setForm((f) => {
        if (key === "email") {
          return { ...f, email: f.email.trim().toLowerCase().replace(/\s+/g, "") };
        }
        if (key === "full_name") {
          return { ...f, full_name: f.full_name.trim().replace(/\s+/g, " ") };
        }
        return f;
      });
    },
    []
  );

  const cleanEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
  const cleanName = form.full_name.trim().replace(/\s+/g, " ");

  const canSubmit =
    cleanName.length >= 2 && cleanEmail.includes("@") && form.role;

  const submit = useCallback(
    async (e) => {
      e?.preventDefault();
      const cEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
      const cName = form.full_name.trim().replace(/\s+/g, " ");
      if (cName.length < 2 || !cEmail.includes("@") || !form.role || status === "loading") return;

      setStatus("loading");
      setServerError("");

      try {
        await postWaitlist({
          full_name: cName,
          email: cEmail,
          role: form.role,
        });
        clearDraft();
        setStatus("success");
      } catch (err) {
        if (err.status === 409) {
          const detail = err.detail;
          if (detail && typeof detail === "object") {
            setExistingUser(detail.existing || null);
            if (detail.code === "ALREADY_REGISTERED_DIFFERENT") {
              setStatus("conflict_prompt");
              return;
            }
          }
          if (detail && typeof detail === "object" && detail.existing) {
            setExistingUser(detail.existing);
          }
          setStatus("already_registered");
        } else {
          setServerError(err.message || "Something went wrong. Please try again.");
          setStatus("error");
        }
      }
    },
    [form, status]
  );

  const requestOtpForUpdate = useCallback(
    async (action = "edit") => {
      const cEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
      if (!cEmail.includes("@") || status === "otp_sending" || status === "otp_verifying") return;

      setTargetAction(action);
      setStatus("otp_sending");
      setServerError("");
      setOtpError("");
      setOtp("");

      try {
        await requestOTP(cEmail);
        setStatus("otp_pending");
        setOtpResendCountdown(60);
      } catch (err) {
        setServerError(err.message || "Failed to send verification code. Please try again.");
        setStatus(existingUser ? "already_registered" : "edit_mode");
      }
    },
    [form, status, existingUser]
  );

  const verifyOtpCode = useCallback(
    async (e) => {
      e?.preventDefault();
      const cEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
      const cleanOtp = otp.trim();
      if (!cleanOtp || cleanOtp.length !== 6 || status === "otp_verifying") return;

      setStatus("otp_verifying");
      setOtpError("");

      try {
        const res = await verifyOTP(cEmail, cleanOtp);
        const token = res?.verification_token;
        setVerificationToken(token);
        setOtp("");

        if (targetAction === "conflict_apply") {
          // Immediately apply details from the conflict prompt
          setStatus("updating");
          const cName = form.full_name.trim().replace(/\s+/g, " ");
          const cRole = form.role;

          await putWaitlist({
            full_name: cName,
            email: cEmail,
            role: cRole,
            verification_token: token,
          });
          clearDraft();
          setStatus("updated");
        } else {
          // Proceed to edit mode with verified session
          setStatus("edit_mode");
        }
      } catch (err) {
        setOtpError(err.message || "Invalid or expired verification code. Please try again.");
        setStatus("otp_pending");
      }
    },
    [form, otp, status, targetAction]
  );

  const resendOtp = useCallback(
    async (e) => {
      e?.preventDefault();
      if (otpResendCountdown > 0) return;

      const cEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
      setOtpError("");

      try {
        await requestOTP(cEmail);
        setOtpResendCountdown(60);
        setOtp("");
      } catch (err) {
        setOtpError(err.message || "Failed to resend verification code.");
      }
    },
    [form, otpResendCountdown]
  );

  const updateSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      const cEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
      const cName = form.full_name.trim().replace(/\s+/g, " ");
      const cRole = form.role;

      if (cName.length < 2 || !cEmail.includes("@") || !cRole || status === "updating") return;

      if (!verificationToken) {
        // If somehow not verified yet, require OTP first
        await requestOtpForUpdate("edit");
        return;
      }

      setStatus("updating");
      setServerError("");

      try {
        await putWaitlist({
          full_name: cName,
          email: cEmail,
          role: cRole,
          verification_token: verificationToken,
        });
        clearDraft();
        setStatus("updated");
      } catch (err) {
        setServerError(err.message || "Failed to update waitlist details.");
        setStatus("edit_mode");
      }
    },
    [form, status, verificationToken, requestOtpForUpdate]
  );

  const startEdit = useCallback(
    (action = "edit") => {
      setServerError("");
      setOtp("");
      setOtpError("");
      requestOtpForUpdate(action);
    },
    [requestOtpForUpdate]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setServerError("");
    setExistingUser(null);
    setOtp("");
    setOtpError("");
    setOtpResendCountdown(0);
    setVerificationToken(null);
    setTargetAction("edit");
  }, []);

  return {
    form,
    touched,
    status,
    serverError,
    existingUser,
    canSubmit,
    setField,
    setRole,
    blur,
    submit,
    updateSubmit,
    requestOtpForUpdate,
    verifyOtpCode,
    resendOtp,
    otp,
    setOtp,
    otpError,
    otpResendCountdown,
    verificationToken,
    targetAction,
    startEdit,
    reset,
  };
}
