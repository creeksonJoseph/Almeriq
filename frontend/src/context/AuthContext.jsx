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
    const res = await loginApi({ email, password });
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (email, password) => {
    const res = await registerApi({ email, password });
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
