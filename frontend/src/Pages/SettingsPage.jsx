import React from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck, Mail, Loader2 } from "lucide-react";
import { useSettings } from "../hooks/useSettings";

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    user,
    pwdStep,
    setPwdStep,
    pwdForm,
    setPwdForm,
    showPwd,
    setShowPwd,
    showConfirmPwd,
    setShowConfirmPwd,
    pwdLoading,
    pwdError,
    setPwdError,
    pwdSuccess,
    pwdCountdown,
    handleRequestChangeOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleChangePassword,
  } = useSettings();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C9A15A]/15 text-[#C9A15A] border border-[#C9A15A]/30">
            <KeyRound size={18} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Password & Security
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white">
              Manage your account password and security preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Security Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
        {/* Left Column: Verification Code Flow */}
        <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 sm:p-7 space-y-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A15A]">
              Step 1
            </span>
            <h2 className="text-base font-semibold text-white mt-1">
              Verify Your Identity
            </h2>
            <p className="text-xs text-white mt-0.5">
              Request and verify a 6-digit security code sent to your email.
            </p>
          </div>

          {pwdSuccess && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          {/* STEP 1: Request Code */}
          {pwdStep === 1 && (
            <form onSubmit={handleRequestChangeOtp} className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white leading-relaxed flex items-start gap-3">
                <Mail size={16} className="text-[#C9A15A] shrink-0 mt-0.5" />
                <div>
                  We will send a 6-digit security code to{" "}
                  <strong className="text-white font-semibold">
                    {user?.email}
                  </strong>{" "}
                  to confirm your identity before changing your password.
                </div>
              </div>

              {pwdError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {pwdError}
                </div>
              )}

              <button
                type="submit"
                disabled={pwdLoading}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] hover:opacity-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {pwdLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2 & 3: Enter OTP */}
          {pwdStep >= 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-xl border border-[#C9A15A]/30 bg-[#C9A15A]/10 p-3.5 text-xs text-[#E8D6A8]">
                Verification code sent to{" "}
                <strong className="text-white font-semibold">{user?.email}</strong>. Check your inbox and spam folder.
              </div>

              {pwdError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {pwdError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  disabled={pwdStep === 3}
                  value={pwdForm.otp}
                  onChange={(e) => {
                    setPwdForm((prev) => ({ ...prev, otp: e.target.value }));
                    setPwdError("");
                  }}
                  placeholder="000000"
                  className="w-56 px-4 py-2.5 rounded-xl tracking-[0.5em] text-center font-mono text-lg outline-none transition-all border border-white/15 bg-[#181824] text-white focus:border-[#C9A15A] focus:ring-1 focus:ring-[#C9A15A]/30 disabled:opacity-60 disabled:bg-white/5"
                />
              </div>

              {pwdStep === 2 && (
                <div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] hover:opacity-95 transition-all shadow-md cursor-pointer"
                  >
                    Verify Code & Continue
                  </button>
                </div>
              )}

              {pwdStep === 3 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={15} />
                  <span>Code Verified!</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 w-56 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPwdStep(1);
                    setPwdError("");
                  }}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  ← Reset
                </button>

                {pwdStep === 2 &&
                  (pwdCountdown > 0 ? (
                    <span className="text-white/40">
                      Resend in <strong className="text-[#C9A15A]">{pwdCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={pwdLoading}
                      className="font-semibold text-[#C9A15A] hover:underline cursor-pointer"
                    >
                      {pwdLoading ? "Sending..." : "Resend Code"}
                    </button>
                  ))}
              </div>
            </form>
          )}
        </div>

        {/* Right Column: New Password & Confirm Password (Locked until OTP is verified) */}
        <div
          className={`rounded-2xl border border-white/10 bg-[#12121a] p-6 sm:p-7 space-y-5 transition-all duration-300 ${
            pwdStep < 3
              ? "opacity-40 blur-[1.5px] pointer-events-none select-none"
              : "opacity-100 blur-none pointer-events-auto"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A15A]">
              Step 2
            </span>
            <h2 className="text-base font-semibold text-white mt-1">
              Set New Password
            </h2>
            <p className="text-xs text-white mt-0.5">
              {pwdStep < 3
                ? "🔒 Verify the security code on the left to unlock."
                : "Enter your new password below."}
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  disabled={pwdStep < 3}
                  value={pwdForm.next}
                  onChange={(e) => {
                    setPwdForm((prev) => ({ ...prev, next: e.target.value }));
                    setPwdError("");
                  }}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs outline-none transition-all border border-white/15 bg-[#181824] text-white placeholder-white/20 focus:border-[#C9A15A] focus:ring-1 focus:ring-[#C9A15A]/30"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? "text" : "password"}
                  required
                  disabled={pwdStep < 3}
                  value={pwdForm.confirm}
                  onChange={(e) => {
                    setPwdForm((prev) => ({ ...prev, confirm: e.target.value }));
                    setPwdError("");
                  }}
                  placeholder="Re-enter new password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs outline-none transition-all border border-white/15 bg-[#181824] text-white placeholder-white/20 focus:border-[#C9A15A] focus:ring-1 focus:ring-[#C9A15A]/30"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPwd((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdLoading || pwdStep < 3}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] hover:opacity-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {pwdLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
