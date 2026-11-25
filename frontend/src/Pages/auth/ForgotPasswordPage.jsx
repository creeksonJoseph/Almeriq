import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import BrandLogo from "../../components/BrandLogo";
import { usePasswordReset } from "../../hooks/usePasswordReset";

export default function ForgotPasswordPage() {
  const {
    step, setStep,
    email, setEmail,
    form, setForm,
    showPwd, setShowPwd,
    loading, error, setError,
    countdown,
    handleSendOtp,
    handleResendOtp,
    handleReset,
  } = usePasswordReset();

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

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <div style={{ animation: "alq-step-in 550ms cubic-bezier(0.32,0.72,0,1) both" }}>
              <div className="text-center mb-6">
                <h2 className="font-serif text-xl text-white font-medium tracking-tight">
                  Forgot Password
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  We'll send a 6-digit code to your email.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 text-red-200 text-xs">{error}</div>
              )}

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
                    onChange={(e) => { setEmail(e.target.value.toLowerCase().replace(/\s+/g, "")); setError(""); }}
                    placeholder="name@example.com"
                    className="alq-input bg-[#13141a] text-white"
                  />
                </div>
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full px-4 py-2.5 rounded-full text-[13px] font-bold uppercase ${
                      !loading ? "bg-[#13141a] text-white hover:bg-[#181a22]" : "bg-[#22242c] text-white/50 cursor-not-allowed"
                    }`}
                  >
                    {loading ? "Sending..." : "Send Code"}
                  </button>
                </div>
              </form>

              <div className="pt-4 text-center">
                <Link to="/login" className="text-xs text-white/60 hover:text-[#f2ca50]">
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* ── Step 2: OTP + New Password ── */}
          {step === 2 && (
            <div style={{ animation: "alq-step-in 550ms cubic-bezier(0.32,0.72,0,1) both" }}>
              <div className="text-center mb-6">
                <h2 className="font-serif text-xl text-white font-medium tracking-tight">
                  Reset Password
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  We sent a code to <span className="text-white/80">{email}</span>
                </p>
                <p className="text-[11px] text-white/40 mt-1">Check your spam folder if you don't see it.</p>
              </div>

              {error && (
                <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 text-red-200 text-xs">{error}</div>
              )}

              <form onSubmit={handleReset} className="space-y-3">
                <div>
                  <label className="alq-label">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={form.otp}
                    onChange={(e) => { setForm((p) => ({ ...p, otp: e.target.value.replace(/\D/g, "") })); setError(""); }}
                    placeholder="000000"
                    className="alq-input bg-[#13141a] text-white text-center tracking-[0.5em]"
                  />
                </div>

                <div>
                  <label className="alq-label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      required
                      minLength={8}
                      value={form.password}
                      onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setError(""); }}
                      placeholder="Min. 8 characters"
                      className="alq-input bg-[#13141a] pr-12 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:text-white"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="alq-label">Confirm Password</label>
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.confirm}
                    onChange={(e) => { setForm((p) => ({ ...p, confirm: e.target.value })); setError(""); }}
                    placeholder="••••••••••••"
                    className="alq-input bg-[#13141a] text-white"
                    style={form.confirm && form.password !== form.confirm ? { boxShadow: "0 0 0 1px #b5573f" } : {}}
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full px-4 py-2.5 rounded-full text-[13px] font-bold uppercase ${
                      !loading ? "bg-[#13141a] text-white hover:bg-[#181a22]" : "bg-[#22242c] text-white/50 cursor-not-allowed"
                    }`}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>

                <div className="flex flex-col items-center gap-2 pt-1">
                  {countdown > 0 ? (
                    <p className="text-xs text-white">
                      Resend code in <span className="text-[#f2ca50] font-semibold">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-xs font-semibold text-[#f2ca50] hover:underline disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Resend code"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="text-xs text-white hover:text-white/80"
                  >
                    ← Use a different email
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
