/**
 * Pages/ForgotPasswordPage.jsx - Request a password reset link.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { forgotPasswordApi } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    setLoading(true);
    setError("");
    try {
      await forgotPasswordApi(cleanEmail);
      setSent(true);
    } catch (err) {
      setError(err.message);
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
        <div className="w-full max-w-[420px] mx-auto animate-fade-in px-4 py-8">
          <div className="text-center mb-6">
            <h2 className="font-serif text-xl text-white font-medium tracking-tight">
              Forgot Password
            </h2>
            <p className="text-xs text-white/60 mt-1">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-xl bg-white/5 text-white/80 text-sm leading-relaxed">
                If an account with that email exists, a reset link has been sent.
                Check your inbox.
              </div>
              <Link
                to="/login"
                className="inline-block text-xs font-semibold text-[#f2ca50] hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 text-red-200 text-xs">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
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
                    className="alq-input bg-[#13141a] text-white"
                  />
                </div>
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full px-4 py-2.5 rounded-full text-[13px] font-bold uppercase transition-[background-color,transform] duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                      !loading
                        ? "bg-[#13141a] text-white hover:bg-[#181a22]"
                        : "bg-[#22242c] text-white/50 cursor-not-allowed"
                    }`}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs text-white/60 hover:text-[#f2ca50]"
                  style={{ transition: "color 400ms cubic-bezier(0.32,0.72,0,1)" }}
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
