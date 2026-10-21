/**
 * lib/api/auth.js - Authentication & onboarding API calls.
 */
import { apiClient, extractErrorMessage } from "../client";

function apiErr(error, msg) {
  const err = new Error(extractErrorMessage(error, msg));
  err.status = error.response?.status;
  err.detail = error.response?.data?.detail;
  return err;
}

// ── OTP Signup Flow ───────────────────────────────────────────────────────────
export async function signupSendOtpApi(email) {
  try {
    const { data } = await apiClient.post("/auth/signup/send-otp", { email });
    return data;
  } catch (e) { throw apiErr(e, "Failed to send verification code"); }
}

export async function signupVerifyOtpApi(email, otp) {
  try {
    // signup_token set as HttpOnly cookie — JS never sees it
    await apiClient.post("/auth/signup/verify-otp", { email, otp });
  } catch (e) { throw apiErr(e, "Invalid verification code"); }
}

export async function signupCompleteApi(password) {
  try {
    const { data } = await apiClient.post("/auth/signup/complete", { password });
    return data;
  } catch (e) { throw apiErr(e, "Failed to create account"); }
}

// ── Credential Auth ───────────────────────────────────────────────────────────
export async function registerApi({ email, password }) {
  try {
    const { data } = await apiClient.post("/auth/register", { email, password });
    return data;
  } catch (e) { throw apiErr(e, "Failed to register"); }
}

export async function loginApi({ email, password }) {
  try {
    const { data } = await apiClient.post("/auth/login", { email, password });
    return data;
  } catch (e) { throw apiErr(e, "Failed to log in"); }
}

export async function googleAuthApi(credential) {
  try {
    const { data } = await apiClient.post("/auth/google", { credential });
    return data;
  } catch (e) { throw apiErr(e, "Google authentication failed"); }
}

// ── Session ───────────────────────────────────────────────────────────────────
export async function getMeApi() {
  try {
    const { data } = await apiClient.get("/auth/me");
    return data;
  } catch { return null; }
}

export async function logoutApi() {
  try {
    const { data } = await apiClient.post("/auth/logout");
    return data;
  } catch { return null; }
}

// ── Onboarding ────────────────────────────────────────────────────────────────
export async function onboardingApi(payload) {
  try {
    const { data } = await apiClient.post("/auth/onboarding", payload);
    return data;
  } catch (e) { throw apiErr(e, "Failed to save onboarding data"); }
}

// ── Password Reset ────────────────────────────────────────────────────────────
export async function forgotPasswordApi(email) {
  try {
    const { data } = await apiClient.post("/auth/forgot-password", { email });
    return data;
  } catch (e) { throw apiErr(e, "Failed to send reset link"); }
}

export async function resetPasswordApi(email, otp, newPassword) {
  try {
    const { data } = await apiClient.post("/auth/reset-password", {
      email, otp, new_password: newPassword,
    });
    return data;
  } catch (e) { throw apiErr(e, "Failed to reset password"); }
}

// ── Authenticated Password Change (Settings) ──────────────────────────────────
export async function sendChangeOtpApi() {
  try {
    const { data } = await apiClient.post("/auth/send-change-otp");
    return data;
  } catch (e) { throw apiErr(e, "Failed to send verification code"); }
}

export async function changePasswordApi({ otp, new_password }) {
  try {
    const { data } = await apiClient.post("/auth/change-password", {
      otp,
      new_password,
    });
    return data;
  } catch (e) { throw apiErr(e, "Failed to change password"); }
}

