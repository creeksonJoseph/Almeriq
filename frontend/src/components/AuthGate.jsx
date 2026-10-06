import React, { useState, useEffect } from "react";
import { registerApi, loginApi, googleAuthApi } from "../lib/api";

export default function AuthGate({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleNotice, setGoogleNotice] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!googleClientId) return;

    // Load Google Identity Services script if Client ID is configured
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        });

        const btnDiv = document.getElementById("googleSignInBtn");
        if (btnDiv) {
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "outline",
            size: "large",
            width: "100%",
            shape: "pill",
            text: "continue_with",
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, [googleClientId]);

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;
    setLoading(true);
    setError("");
    try {
      const res = await googleAuthApi(response.credential);
      if (onAuthSuccess) onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClickManual = () => {
    if (!googleClientId) {
      setGoogleNotice(true);
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = isLogin
        ? await loginApi({ email, password })
        : await registerApi({ email, password });

      if (onAuthSuccess) {
        onAuthSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Outer Shell - Double Bezel Architecture */}
      <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-2 backdrop-blur-2xl shadow-2xl">
        {/* Inner Core */}
        <div className="bg-[#0D0D12] rounded-[calc(2rem-0.5rem)] border border-white/5 p-6 md:p-8 relative overflow-hidden">
          
          {/* Ambient Glow Pill */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#C9A15A]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A15A]/10 border border-[#C9A15A]/20 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#C9A15A] mb-3">
              Phase 1 • Low-Friction Gate
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {isLogin
                ? "Enter your credentials to access your dashboard"
                : "Sign up with just your email and password to start"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-[#16161D] p-1 rounded-full border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                !isLogin ? "bg-[#C9A15A] text-[#0A0A0B] shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                isLogin ? "bg-[#C9A15A] text-[#0A0A0B] shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Google Client Notice */}
          {googleNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#C9A15A]/10 border border-[#C9A15A]/20 text-[#C9A15A] text-xs space-y-1">
              <p className="font-semibold">🔑 Google OAuth Configuration</p>
              <p className="text-gray-300 text-[11px]">
                To activate Google Sign-In, add your Google Client ID to <code className="bg-black/30 px-1 py-0.5 rounded text-white">frontend/.env</code> as <code className="bg-black/30 px-1 py-0.5 rounded text-white">VITE_GOOGLE_CLIENT_ID</code> and <code className="bg-black/30 px-1 py-0.5 rounded text-white">server/.env</code> as <code className="bg-black/30 px-1 py-0.5 rounded text-white">GOOGLE_CLIENT_ID</code>.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="alq-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="alq-input"
              />
            </div>

            {/* Primary Action Button (Button-in-Button Architecture) */}
            <button
              type="submit"
              disabled={loading}
              className="alq-submit group relative w-full overflow-hidden mt-2"
            >
              <span>{loading ? "Processing..." : isLogin ? "Sign In to Dashboard" : "Continue to Setup"}</span>
              <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#0D0D12] text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Google Auth Button Container */}
          <div className="space-y-2">
            <div id="googleSignInBtn" className="w-full flex justify-center"></div>
            
            {/* Fallback Google Pill Button */}
            {!googleClientId && (
              <button
                type="button"
                onClick={handleGoogleClickManual}
                className="w-full min-h-[48px] py-3 px-4 rounded-full bg-[#181820] hover:bg-[#20202B] border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
