/**
 * Pages/ForgotPasswordPage.jsx - Request a password reset link.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";

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
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Something went wrong.");
      }
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
        <div className="w-full max-w-md mx-auto animate-fade-in px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-medium tracking-tight">
              Forgot Password
            </h2>
            <p className="text-xs text-white/60 mt-2">
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
                    className="alq-input bg-[#13141a] text-white"
                  />
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
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs text-white/60 hover:text-[#f2ca50] transition-colors"
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
