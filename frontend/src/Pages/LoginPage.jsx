/**
 * Pages/LoginPage.jsx - Canonical Sign In Page.
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "1";

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!googleClientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        if (window.__alimeriqGoogleInitialized !== "login") {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleResponse,
          });
          window.__alimeriqGoogleInitialized = "login";
        }

        const btnDiv = document.getElementById("googleSignInBtnPage");
        if (btnDiv) {
          const width = Math.max(
            240,
            Math.floor(btnDiv.getBoundingClientRect().width),
          );
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "outline",
            size: "large",
            width,
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
    <div className="fixed inset-0 overflow-hidden bg-[#0c0e13]">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <span className="whitespace-nowrap text-[clamp(4rem,17vw,14rem)] font-serif font-semibold leading-none tracking-[0.08em] text-white/[0.035] select-none">
          ALIMERIQ
        </span>
      </div>
      <BrandLogo
        size={52}
        showName={false}
        href="/"
        className="absolute left-6 top-8 z-10 opacity-80 sm:left-10 sm:top-12"
      />
      <div className="relative z-10 h-full overflow-y-auto">
        <div className="w-full max-w-md mx-auto animate-fade-in px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-medium tracking-tight">
              Sign In to Alimeriq
            </h2>
            <p className="text-xs text-white/60 mt-2">
              Welcome back to Alimeriq.
            </p>
          </div>

          <div className="space-y-5">
            {resetSuccess && (
            <div className="p-3 rounded-xl bg-white/5 text-white/80 text-xs">
              Password updated successfully. You can now sign in.
            </div>
          )}
          {error && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-200 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div
                id="googleSignInBtnPage"
                className="w-full flex justify-center min-h-[44px]"
              />

              {!googleClientId && (
                <button
                  type="button"
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#13141a] hover:bg-[#181a22] text-white font-medium text-xs flex items-center justify-center transition-colors"
                >
                  Continue with Google
                </button>
              )}

              <div className="flex items-center justify-center pt-1">
                <span className="bg-[#0c0e13] px-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                  Or
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="alq-label">Email Address</label>
                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value.toLowerCase().replace(/\s+/g, ""))
                  }
                  placeholder="you@company.com"
                  className="alq-input bg-[#13141a] pr-12 text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="alq-label">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-medium text-white/60 hover:text-[#f2ca50] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="alq-input bg-[#13141a] pr-12 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-6 py-3 rounded-full text-xs font-bold uppercase transition-colors ${
                    !loading
                      ? "bg-[#13141a] text-white hover:bg-[#181a22]"
                      : "bg-[#22242c] text-white/50 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </form>

            <div className="pt-4 text-center">
              <p className="text-xs text-white/80">
                Don&apos;t have an account yet?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-[#f2ca50] hover:underline"
                >
                  Sign Up
                </Link>
              </p>
              <Link
                to="/privacy"
                className="mt-2 inline-block text-[11px] text-white/50 hover:text-[#f2ca50] transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
