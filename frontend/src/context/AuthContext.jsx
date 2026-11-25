/**
 * context/AuthContext.jsx - Centralized Authentication & User Session Provider.
 *
 * JWT lives exclusively in HttpOnly cookies set by the backend.
 * JS never touches the token, eliminating XSS token theft.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { normalizeRole } from "../lib/roles";
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

const ROLE_ALIASES = {
  infrastructure: "infrastructure_provider",
};

function normalizeUser(user) {
  if (!user || !user.role) return user;
  const normalized = normalizeRole(user.role);
  return { ...user, role: ROLE_ALIASES[normalized] ?? normalized };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("almeriq_user");
      return cached ? normalizeUser(JSON.parse(cached)) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!user);

  const saveUser = useCallback((nextUser) => {
    const normalized = normalizeUser(nextUser);
    setUser(normalized);
    try {
      if (normalized) {
        localStorage.setItem("almeriq_user", JSON.stringify(normalized));
      } else {
        localStorage.removeItem("almeriq_user");
      }
    } catch {
      // Ignore storage errors in private browsing modes
    }
  }, []);

  // Sync user session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const currentUser = await getMeApi();
        if (currentUser) {
          saveUser(normalizeUser(currentUser));
        } else {
          saveUser(null);
        }
      } catch (err) {
        if (err?.status === 401 || err?.response?.status === 401) {
          saveUser(null);
        }
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, [saveUser]);

  const login = useCallback(async (email, password) => {
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().replace(/\s+/g, "") : email;
    const res = await loginApi({ email: cleanEmail, password });
    saveUser(normalizeUser(res.user));
    return res.user;
  }, [saveUser]);

  const register = useCallback(async (email, password) => {
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().replace(/\s+/g, "") : email;
    const res = await registerApi({ email: cleanEmail, password });
    saveUser(normalizeUser(res.user));
    return res.user;
  }, [saveUser]);

  const googleLogin = useCallback(async (credential) => {
    const res = await googleAuthApi(credential);
    saveUser(normalizeUser(res.user));
    return res.user;
  }, [saveUser]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      saveUser(null);
    }
  }, [saveUser]);

  const completeOnboarding = useCallback(async (payload) => {
    const res = await onboardingApi(payload);
    saveUser(normalizeUser(res.user));
    return res.user;
  }, [saveUser]);

  const signupSendOtp = useCallback(async (email) => {
    return await signupSendOtpApi(email);
  }, []);

  const signupVerifyOtp = useCallback(async (email, otp) => {
    await signupVerifyOtpApi(email, otp);
    // cookie set by server
  }, []);

  const signupComplete = useCallback(async (password) => {
    const res = await signupCompleteApi(password);
    saveUser(normalizeUser(res.user));
    return res.user;
  }, [saveUser]);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = normalizeUser({ ...(prev || {}), ...updatedUserData });
      try {
        localStorage.setItem("almeriq_user", JSON.stringify(merged));
      } catch {}
      return merged;
    });
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
