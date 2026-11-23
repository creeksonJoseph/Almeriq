import React from "react";
import { useNavigate } from "react-router-dom";
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Loader2,
  User,
} from "lucide-react";
import { useSettings } from "../../hooks/useSettings";

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
    <div className="w-full px-4 sm:px-6 lg:px-10 py-6 pb-24 space-y-8">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2ca50]/10 text-[#f2ca50] border border-[#f2ca50]/20">
              <KeyRound size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Account Settings &amp; Security
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-white">
                Manage your credentials, verify your identity, and update account security preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Quick Strip: Covers the page */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border border-white/10 rounded-xl bg-white/[0.015] p-2">
        <div className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white border border-white/10">
            <User size={16} />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-white/70">
              Account Name
            </span>
            <span className="mt-0.5 block text-sm font-semibold text-white truncate">
              {user?.full_name || "Account Member"}
            </span>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#f2ca50] border border-white/10">
            <Mail size={16} />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-white/70">
              Registered Email
            </span>
            <span className="mt-0.5 block text-sm font-semibold text-white truncate font-mono">
              {user?.email || "No email on record"}
            </span>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white border border-white/10">
            <span className="h-2 w-2 rounded-full bg-[#f2ca50]"></span>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-white/70">
              Workspace Role
            </span>
            <span className="mt-0.5 block text-sm font-semibold text-[#f2ca50] capitalize">
              {user?.role || "Founder"}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Full-Width Security Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Left Column: Verification Code Flow */}
        <div className="rounded-2xl border border-white/10 bg-[#121318] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f2ca50]">
                Step 01
              </span>
              <h2 className="text-lg font-semibold text-white mt-1">
                Verify Your Identity
              </h2>
              <p className="text-xs text-white/80 mt-1">
                Request and verify a 6-digit security code sent to your registered email address.
              </p>
            </div>

            {pwdSuccess && (
              <div className="p-3.5 rounded-xl border border-[#f2ca50]/30 bg-[#f2ca50]/10 text-xs font-medium text-white flex items-center gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 text-[#f2ca50]" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {/* STEP 1: Request Code */}
            {pwdStep === 1 && (
              <form onSubmit={handleRequestChangeOtp} className="space-y-5">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white leading-relaxed flex items-start gap-3">
                  <Mail size={16} className="text-[#f2ca50] shrink-0 mt-0.5" />
                  <div>
                    We will send a 6-digit security code to{" "}
                    <strong className="text-white font-semibold">
                      {user?.email}
                    </strong>{" "}
                    to confirm your identity before changing your password.
                  </div>
                </div>

                {pwdError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {pwdError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-md font-semibold text-xs text-black bg-[#f2ca50] hover:bg-[#e2ba40] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {pwdLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-black" />
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
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="rounded-xl border border-[#f2ca50]/30 bg-[#f2ca50]/10 p-3.5 text-xs text-white">
                  Verification code sent to{" "}
                  <strong className="text-white font-semibold">{user?.email}</strong>. Check your inbox and spam folder.
                </div>

                {pwdError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {pwdError}
                  </div>
                )}

                <div className="space-y-2">
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
                    className="w-full max-w-xs px-4 py-2.5 rounded-lg tracking-[0.5em] text-center font-mono text-lg outline-none transition-all border border-[#282a2f] bg-[#181824] text-white focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50]/30 disabled:opacity-60 disabled:bg-white/5"
                  />
                </div>

                {pwdStep === 2 && (
                  <div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center py-2.5 px-6 rounded-md font-semibold text-xs text-black bg-[#f2ca50] hover:bg-[#e2ba40] transition-all shadow-sm cursor-pointer"
                    >
                      Verify Code &amp; Continue
                    </button>
                  </div>
                )}

                {pwdStep === 3 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#f2ca50]/40 bg-[#f2ca50]/10 text-xs font-semibold text-[#f2ca50]">
                    <CheckCircle2 size={15} />
                    <span>Code Verified!</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 max-w-xs text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPwdStep(1);
                      setPwdError("");
                    }}
                    className="text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Reset
                  </button>

                  {pwdStep === 2 &&
                    (pwdCountdown > 0 ? (
                      <span className="text-white/50">
                        Resend in <strong className="text-[#f2ca50]">{pwdCountdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={pwdLoading}
                        className="font-semibold text-[#f2ca50] hover:underline cursor-pointer"
                      >
                        {pwdLoading ? "Sending..." : "Resend Code"}
                      </button>
                    ))}
                </div>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-white/50">
            Protected by standard two-factor email verification.
          </div>
        </div>

        {/* Right Column: New Password & Confirm Password (Locked until OTP is verified) */}
        <div
          className={`rounded-2xl border border-white/10 bg-[#121318] p-6 sm:p-8 space-y-6 flex flex-col justify-between transition-all duration-300 ${
            pwdStep < 3
              ? "opacity-50 blur-[1px] pointer-events-none select-none"
              : "opacity-100 blur-none pointer-events-auto"
          }`}
        >
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f2ca50]">
                Step 02
              </span>
              <h2 className="text-lg font-semibold text-white mt-1">
                Set New Password
              </h2>
              <p className="text-xs text-white/80 mt-1">
                {pwdStep < 3
                  ? "Verify the security code in Step 1 to unlock password update."
                  : "Choose a strong password containing at least 8 characters."}
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
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg text-xs outline-none transition-all border border-[#282a2f] bg-[#181824] text-white placeholder-white/20 focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50]/30"
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
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg text-xs outline-none transition-all border border-[#282a2f] bg-[#181824] text-white placeholder-white/20 focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50]/30"
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
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-md font-semibold text-xs text-black bg-[#f2ca50] hover:bg-[#e2ba40] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {pwdLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-black" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-white/50">
            Password requirements: at least 8 characters.
          </div>
        </div>
      </div>
    </div>
  );
}
