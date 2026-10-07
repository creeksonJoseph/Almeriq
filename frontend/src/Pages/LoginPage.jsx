/**
 * Pages/LoginPage.jsx - Canonical Sign In Page.
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin, updateUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!googleClientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        });

        const btnDiv = document.getElementById("googleSignInBtnPage");
        if (btnDiv) {
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "outline",
            size: "large",
            width: "100%",
            shape: "pill",
            text: "signin_with",
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
      const user = await googleLogin(response.credential);
      navigate(user.onboarding_completed ? "/dashboard" : "/");
    } catch (err) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, "");
    if (!cleanEmail || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await login(cleanEmail, password);
      navigate(user.onboarding_completed ? "/dashboard" : "/");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center min-h-[calc(100vh-5rem)] bg-[#0c0e13] px-4 py-12">
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-2 backdrop-blur-2xl shadow-2xl">
          <div className="bg-[#0D0D12] rounded-[calc(2rem-0.5rem)] border border-white/5 p-6 md:p-8 relative overflow-hidden">
            
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#C9A15A]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A15A]/10 border border-[#C9A15A]/20 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#C9A15A] mb-3">
                Phase 1 • Gate
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
                Sign In to Alimeriq
              </h2>
              <p className="text-sm text-white mt-1">
                Enter your credentials to access your dashboard
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  placeholder="name@company.com"
                  className="alq-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="alq-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="alq-submit group relative w-full overflow-hidden mt-2"
              >
                <span>{loading ? "Signing in..." : "Sign In to Dashboard"}</span>
                <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 bg-[#0D0D12] text-[11px] font-medium text-white uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            <div id="googleSignInBtnPage" className="w-full flex justify-center min-h-[44px]"></div>

            {!googleClientId && (
              <button
                type="button"
                className="w-full mt-2 min-h-[44px] py-2.5 px-4 rounded-full bg-[#181820] hover:bg-[#20202B] border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-3 transition-all"
              >
                <span>Continue with Google</span>
              </button>
            )}

            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              <p className="text-xs text-white">
                Don't have an account yet?{" "}
                <Link to="/signup" className="font-semibold text-[#C9A15A] hover:underline">
                  Create an Account →
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

