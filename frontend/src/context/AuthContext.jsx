/**
 * context/AuthContext.jsx - Centralized Authentication & User Session Provider.
 *
 * JWT lives exclusively in HttpOnly cookies set by the backend.
 * JS never touches the token, eliminating XSS token theft.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getMeApi,
  loginApi,
  registerApi,
  googleAuthApi,
  logoutApi,
  onboardingApi,
  signupSendOtpApi,
  signupVerifyOtpApi,
  signupCompleteApi,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const currentUser = await getMeApi();
        if (currentUser) setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().replace(/\s+/g, "") : email;
    const res = await loginApi({ email: cleanEmail, password });
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (email, password) => {
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().replace(/\s+/g, "") : email;
    const res = await registerApi({ email: cleanEmail, password });
    setUser(res.user);
    return res.user;
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const res = await googleAuthApi(credential);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(async (payload) => {
    const res = await onboardingApi(payload);
    setUser(res.user);
    return res.user;
  }, []);

  const signupSendOtp = useCallback(async (email) => {
    return await signupSendOtpApi(email);
  }, []);

  const signupVerifyOtp = useCallback(async (email, otp) => {
    await signupVerifyOtpApi(email, otp);
    // cookie set by server
  }, []);

  const signupComplete = useCallback(async (password) => {
    const res = await signupCompleteApi(password);
    setUser(res.user);
    return res.user;
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => ({ ...(prev || {}), ...updatedUserData }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: Boolean(user),
        onboardingCompleted: Boolean(user?.onboarding_completed),
        login,
        register,
        googleLogin,
        logout,
        completeOnboarding,
        updateUser,
        signupSendOtp,
        signupVerifyOtp,
        signupComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
