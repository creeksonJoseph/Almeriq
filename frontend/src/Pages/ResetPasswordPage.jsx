/**
 * Pages/ResetPasswordPage.jsx - Consume reset token and set a new password.
 */
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0c0e13]">
        <div className="text-center space-y-4 px-4">
          <p className="text-white/70 text-sm">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="text-xs font-semibold text-[#f2ca50] hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Something went wrong.");
      navigate("/login?reset=1");
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
              Set New Password
            </h2>
            <p className="text-xs text-white/60 mt-2">
              Choose a strong password for your account.
            </p>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-200 text-xs">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="alq-label">New Password</label>
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
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="alq-input bg-[#13141a] pr-12 text-white"
                  />
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
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
