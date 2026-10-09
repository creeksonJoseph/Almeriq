/**
 * Pages/SignupPage.jsx - 3-step signup: email → OTP verification → password.
 */
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useSignupFlow } from "../hooks/useSignupFlow";
import BrandLogo from "../components/BrandLogo";

const STEP_META = {
  1: {
    heading: "Create an Account",
    sub: "Start by entering your email address.",
  },
  2: { heading: "Check Your Email", sub: null },
  3: {
    heading: "Set Your Password",
    sub: "Choose a strong password to secure your account.",
  },
};

const btnBase =
  "w-full px-6 py-3 rounded-full text-xs font-bold uppercase active:scale-[0.98]";
const btnStyle = {
  transition:
    "background-color 400ms cubic-bezier(0.32,0.72,0,1), transform 400ms cubic-bezier(0.32,0.72,0,1)",
};
const stepIn = {
  animation: "alq-step-in 550ms cubic-bezier(0.32,0.72,0,1) both",
};

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className="rounded-full"
          style={{
            width: s === current ? "24px" : "8px",
            height: "8px",
            backgroundColor:
              s <= current ? "#f2ca50" : "rgba(255,255,255,0.15)",
            transition:
              "width 500ms cubic-bezier(0.32,0.72,0,1), background-color 500ms cubic-bezier(0.32,0.72,0,1)",
          }}
        />
      ))}
    </div>
  );
}

export default function SignupPage() {
  const {
    step,
    email,
    setEmail,
    otp,
    setOtp,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    loading,
    error,
    countdown,
    clearError,
    handleSendOtp,
    handleResendOtp,
    handleVerifyOtp,
    handleComplete,
    handleGoogleSuccess,
    resetToEmail,
  } = useSignupFlow();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!googleClientId || step !== 1) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        if (window.__alimeriqGoogleInitialized !== "signup-otp") {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (res) =>
              res.credential && handleGoogleSuccess(res.credential),
          });
          window.__alimeriqGoogleInitialized = "signup-otp";
        }
        const btnDiv = document.getElementById("googleSignInBtnSignupOtp");
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
  }, [googleClientId, step, handleGoogleSuccess]);

  const meta = STEP_META[step];

  return (
    <div className="auth-screen">
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

      <div className="auth-scroll">
        <div className="auth-content max-w-[420px] animate-fade-in">
          <StepDots current={step} />

          <div className="text-center mb-6">
            <h2 className="font-serif text-xl text-white font-medium tracking-tight">
              {meta.heading}
            </h2>
            <p className="text-xs text-white/60 mt-2">
              {step === 2 ? (
                <>
                  We sent a 6-digit code to{" "}
                  <span className="text-white/80">{email}</span>
                </>
              ) : (
                meta.sub
              )}
            </p>
            {step === 2 && (
              <p className="text-[11px] text-white/40 mt-1">
                Check your spam folder if you don't see it.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-200 text-xs">
                {error}
              </div>
            )}

            {/* ── Step 1: Email ── */}
            {step === 1 && (
              <div key="step-1" style={stepIn}>
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="alq-label">Email Address</label>
                    <input
                      type="email"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      value={email}
                      onChange={(e) => {
                        setEmail(
                          e.target.value.toLowerCase().replace(/\s+/g, ""),
                        );
                        clearError();
                      }}
                      placeholder="name@example.com"
                      className="alq-input bg-[#13141a] text-white"
                    />
                  </div>
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      style={btnStyle}
                      className={`${btnBase} py-2.5 text-[13px] ${!loading ? "bg-[#13141a] text-white hover:bg-[#181a22]" : "bg-[#22242c] text-white/50 cursor-not-allowed"}`}
                    >
                      {loading ? "Sending..." : "Continue with Email"}
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-center pt-4">
                  <span className="bg-[#0c0e13] px-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                    Or
                  </span>
                </div>

                <div
                  id="googleSignInBtnSignupOtp"
                  className="w-full flex justify-center min-h-[44px] mt-3"
                />
                {!googleClientId && (
                  <button
                    type="button"
                    style={btnStyle}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#13141a] hover:bg-[#181a22] text-white font-medium text-xs flex items-center justify-center active:scale-[0.98]"
                  >
                    Continue with Google
                  </button>
                )}
              </div>
            )}

            {/* ── Step 2: OTP ── */}
            {step === 2 && (
              <div key="step-2" style={stepIn}>
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="alq-label">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ""));
                        clearError();
                      }}
                      placeholder="000000"
                      className="alq-input bg-[#13141a] text-white text-center tracking-[0.5em]"
                    />
                  </div>
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      style={btnStyle}
                      className={`${btnBase} py-2.5 text-[13px] ${!loading ? "bg-[#13141a] text-white hover:bg-[#181a22]" : "bg-[#22242c] text-white/50 cursor-not-allowed"}`}
                    >
                      {loading ? "Verifying..." : "Verify Email"}
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-2 pt-1">
                    {countdown > 0 ? (
                      <p className="text-xs text-white/50">
                        Resend code in{" "}
                        <span className="text-[#f2ca50] font-semibold">
                          {countdown}s
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-xs font-semibold text-[#f2ca50] hover:underline disabled:opacity-50"
                        style={{
                          transition:
                            "opacity 400ms cubic-bezier(0.32,0.72,0,1)",
                        }}
                      >
                        {loading ? "Sending..." : "Resend code"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetToEmail}
                      className="text-xs text-white/50 hover:text-white/80"
                      style={{
                        transition: "color 400ms cubic-bezier(0.32,0.72,0,1)",
                      }}
                    >
                      ← Use a different email
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Step 3: Password ── */}
            {step === 3 && (
              <div key="step-3" style={stepIn}>
                <form onSubmit={handleComplete} className="space-y-3">
                  <div>
                    <label className="alq-label">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearError();
                        }}
                        placeholder="Min. 8 characters"
                        className="alq-input bg-[#13141a] pr-12 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:text-white"
                        style={{
                          transition: "color 400ms cubic-bezier(0.32,0.72,0,1)",
                        }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {password && (
                      <div className="flex gap-1 mt-2 h-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-full"
                            style={{
                              backgroundColor:
                                password.length > i * 3
                                  ? password.length >= 12
                                    ? "#22c55e"
                                    : password.length >= 8
                                      ? "#f2ca50"
                                      : "#ef4444"
                                  : "rgba(255,255,255,0.1)",
                              transition:
                                "background-color 400ms cubic-bezier(0.32,0.72,0,1)",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="alq-label">Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearError();
                      }}
                      placeholder="••••••••••••"
                      className="alq-input bg-[#13141a] text-white"
                      style={
                        confirmPassword && password !== confirmPassword
                          ? { boxShadow: "0 0 0 1px #b5573f" }
                          : {}
                      }
                    />
                  </div>
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      style={btnStyle}
                      className={`${btnBase} py-2.5 text-[13px] ${!loading ? "bg-[#13141a] text-white hover:bg-[#181a22]" : "bg-[#22242c] text-white/50 cursor-not-allowed"}`}
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            )}

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
                className="mt-2 inline-block text-[11px] text-white/50 hover:text-[#f2ca50]"
                style={{
                  transition: "color 400ms cubic-bezier(0.32,0.72,0,1)",
                }}
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
