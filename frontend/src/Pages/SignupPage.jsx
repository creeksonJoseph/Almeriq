/**
 * Pages/SignupPage.jsx - Canonical Sign Up Page.
 * (Handles both /signup and /register route paths without duplication)
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        if (window.__alimeriqGoogleInitialized !== "signup") {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleResponse,
          });
          window.__alimeriqGoogleInitialized = "signup";
        }

        const btnDiv = document.getElementById("googleSignInBtnSignupPage");
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
            text: "signup_with",
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
    if (!cleanEmail || !password || !confirmPassword) {
      setError("Please provide your email and both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register(cleanEmail, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to create account.");
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
              Create an Account
            </h2>
            <p className="text-xs text-white/60 mt-2">
              Join Alimeriq with your email.
            </p>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-200 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div
                id="googleSignInBtnSignupPage"
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
                <label className="alq-label">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
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

              <div>
                <label className="alq-label">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="alq-input bg-[#13141a] pr-12 text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    title={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
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
                  {loading ? "Signing Up..." : "Sign Up"}
                </button>
              </div>
            </form>

            <div className="pt-4 text-center">
              <p className="text-xs text-white/80">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#f2ca50] hover:underline"
                >
                  Sign In
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
