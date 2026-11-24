import { useRef } from "react";
import {
  ArrowRight, CheckCircle2, Loader2, Building2, TrendingUp, Briefcase, Truck,
  Globe2, Lock, User, Mail, ShieldCheck,
} from "lucide-react";
import { useWaitlist } from "../../hooks/useWaitlist";
import BrandLogo from "../BrandLogo";

const C = {
  bg: "#0c0e13",
  surface: "#111318",
  surfaceLow: "#1a1b21",
  surfaceContainer: "#1e2025",
  surfaceHigh: "#282a2f",
  gold: "#f2ca50",
  goldDim: "#d4af37",
  goldSoft: "rgba(242,202,80,0.12)",
  goldBorder: "rgba(242,202,80,0.35)",
  text: "#ffffff",
  outline: "#ffffff",
};

const ROLES = [
  { id: "Founder", icon: Building2, color: C.gold, desc: "Build a venture, publish startup pitches, hire, and request infrastructure" },
  { id: "Investor", icon: TrendingUp, color: C.gold, desc: "Discover founder-published pitches, open conversations, and record portfolio positions" },
  { id: "Job Seeker", icon: Briefcase, color: C.gold, desc: "Find startup roles, apply directly, and track application status" },
  { id: "Infrastructure Provider", icon: Truck, color: C.gold, desc: "List infrastructure assets and manage incoming order requests" },
  { id: "Expert", icon: ShieldCheck, color: C.gold, desc: "Offer specialist advice to founders through scoped advisory requests" },
];

const CAPABILITIES = [
  {
    num: "01",
    color: C.gold,
    title: "Guided venture builder",
    desc: "AI-assisted tools help founders work through idea validation, market sizing, business plans, MVP scoping, and company registration guidance."
  },
  {
    num: "02",
    color: C.gold,
    title: "Founder-published investor deal flow",
    desc: "Investors discover published startup pitches, review founder-provided information, request discussions, and keep manually recorded portfolio entries."
  },
  {
    num: "03",
    color: C.gold,
    title: "Startup hiring workspace",
    desc: "Founders publish roles and review applications. Job seekers browse openings, apply directly, and follow application status."
  },
  {
    num: "04",
    color: C.gold,
    title: "Infrastructure marketplace",
    desc: "Providers list physical and digital assets. Founders can request an order and follow its recorded fulfilment status; checkout is simulated."
  },
  {
    num: "05",
    color: C.gold,
    title: "Legal and compliance guidance",
    desc: "Use AI-assisted guidance and editable document templates for company setup and compliance. Almeriq does not submit government filings."
  },
  {
    num: "06",
    color: C.gold,
    title: "Marketplace payment workflow",
    desc: "Record order terms and a preferred payment method during simulated checkout. Live payment processing and escrow are not enabled yet."
  }
];

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0c0e13] pt-8 sm:pt-12 pb-12 sm:pb-16 lg:pb-24 border-b border-[#1e2025]">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[520px] bg-gradient-to-b from-[#f2ca50]/12 via-[#f2ca50]/4 to-transparent blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-baseline">
          <div className="lg:col-span-8">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-7xl font-medium tracking-tight text-white leading-[1.1]">
              One unified platform to build, fund,{" "}
              <span className="italic text-[#f2ca50]">
                hire, and scale
              </span>{" "}
              your company.
            </h1>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-between self-end">
            <p className="text-sm sm:text-base lg:text-lg text-white leading-relaxed">
              ALIMERIQ connects founders, investors, job seekers, and infrastructure providers into one seamless ecosystem.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EcosystemSection() {
  return (
    <section id="ecosystem" className="w-full bg-[#111318] py-12 sm:py-16 lg:py-20 border-b border-[#1e2025]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 sm:pb-12">
          <div>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl text-white font-medium">Five Stakeholders. One Ecosystem.</h2>
          </div>
          <p className="text-xs sm:text-sm text-white max-w-md mt-3 md:mt-0 leading-relaxed">
            Replacing fragmented tools with a single unified platform where capital, talent, founders, and physical assets connect.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[#282a2f] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Founders</h3>
              <p className="text-xs text-white leading-relaxed">
                Venture building accelerated with structured tools. From idea validation and business plans to investor exposure, hiring, and renting infrastructure.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Investors</h3>
              <p className="text-xs text-white leading-relaxed">
                Discover founder-published pitches, request discussions, and maintain manually recorded portfolio positions. Almeriq does not verify transfers or provide live operational telemetry.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Job Seekers</h3>
              <p className="text-xs text-white leading-relaxed">
                Browse startup job postings, submit applications, and track responses from employers.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Experts</h3>
              <p className="text-xs text-white leading-relaxed">
                Share specialist knowledge with founders through advisory requests, scoped discussions, and completion tracking.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Asset Lessors</h3>
              <p className="text-xs text-white leading-relaxed">
                List servers, compute, storage, warehousing, and transport assets. Manage order requests and fulfilment updates in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="w-full bg-[#0c0e13] py-12 sm:py-16 lg:py-20 border-b border-[#1e2025]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl text-white font-medium mb-4 sm:mb-6 leading-tight">
            Institutional capabilities without the friction.
          </h2>

          <div className="flex flex-col divide-y divide-[#282a2f]/60">
            {CAPABILITIES.map((cap) => (
              <div key={cap.num} className="py-5 sm:py-6 first:pt-0 last:pb-0">
                <h3 className="text-lg sm:text-xl font-semibold text-white font-serif mb-1.5 sm:mb-2">{cap.title}</h3>
                <p className="text-xs sm:text-sm text-white leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function WaitlistFormSection() {
  const {
    form,
    touched,
    status,
    serverError,
    existingUser,
    canSubmit,
    setField,
    setRole,
    blur,
    submit,
    updateSubmit,
    verifyOtpCode,
    resendOtp,
    otp,
    setOtp,
    otpError,
    otpResendCountdown,
    targetAction,
    startEdit,
    reset,
  } = useWaitlist();
  const resultRef = useRef(null);

  const handleSubmit = async (e) => {
    await submit(e);
    setTimeout(() => resultRef.current?.focus(), 80);
  };

  const handleUpdate = async (e) => {
    await updateSubmit(e);
    setTimeout(() => resultRef.current?.focus(), 80);
  };

  const handleVerifyOtp = async (e) => {
    await verifyOtpCode(e);
    setTimeout(() => resultRef.current?.focus(), 80);
  };

  return (
    <section id="access-console" className="w-full bg-[#0c0e13] py-12 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10 lg:mb-12">
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-medium mb-2.5 sm:mb-4">
            {status === "edit_mode" || status === "updating"
              ? "Update Your Details"
              : status === "otp_pending" || status === "otp_sending" || status === "otp_verifying"
              ? "Verify Your Email"
              : status === "conflict_prompt"
              ? "Already on Waitlist"
              : status === "already_registered"
              ? "Already Registered"
              : status === "updated"
              ? "Details Updated"
              : "Join the ALIMERIQ Network"}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-white leading-relaxed">
            {status === "edit_mode" || status === "updating"
              ? `Update your role or full name for ${form.email}.`
              : status === "otp_pending" || status === "otp_sending" || status === "otp_verifying"
              ? `We sent a 6-digit verification code to ${form.email} to confirm your ownership.`
              : status === "conflict_prompt"
              ? "This email is already registered with different details."
              : status === "already_registered"
              ? "Your email is already secured on the waitlist."
              : status === "updated"
              ? "Your waitlist profile has been refreshed."
              : "Select your role to join the waitlist."}
          </p>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <div
            ref={resultRef}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={-1}
            className="outline-none"
          >
            {status === "success" && (
              <div className="text-center py-8 sm:py-12 px-2 sm:px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <CheckCircle2 size={28} color={C.gold} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl sm:text-4xl text-white font-medium mb-2.5 sm:mb-3">
                  You're on the list, {form.full_name.split(" ")[0]}! 🎉
                </h3>
                <p className="text-xs sm:text-sm text-white max-w-md mx-auto mb-6 leading-relaxed">
                  We'll notify you at <span className="text-[#f2ca50] font-semibold">{form.email}</span> the moment access opens for <span className="text-white font-semibold">{form.role}</span>.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[#282a33] text-xs font-semibold uppercase tracking-wider text-white hover:text-[#f2ca50] transition-colors"
                >
                  Register another team member
                </button>
              </div>
            )}

            {status === "already_registered" && (
              <div className="text-center py-8 sm:py-12 px-2 sm:px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <CheckCircle2 size={28} color={C.gold} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl sm:text-4xl text-white font-medium mb-2.5 sm:mb-3">
                  You're already registered!
                </h3>
                <p className="text-xs sm:text-sm text-white max-w-md mx-auto mb-6 leading-relaxed">
                  We already have you on the ALIMERIQ waitlist as a <span className="text-[#f2ca50] font-semibold">{existingUser?.role || form.role}</span> with <span className="text-[#f2ca50] font-semibold">{existingUser?.email || form.email}</span>. We will reach out the moment early access opens.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit("edit")}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40] text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Change My Details
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[#282a33] text-xs font-semibold uppercase tracking-wider text-white hover:text-[#f2ca50] transition-colors"
                  >
                    Register Another Email
                  </button>
                </div>
              </div>
            )}

            {status === "conflict_prompt" && (
              <div className="text-center py-8 sm:py-12 px-2 sm:px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <User size={26} color={C.gold} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium mb-3">
                  Change your details?
                </h3>
                <p className="text-xs sm:text-sm text-white max-w-lg mx-auto mb-4 leading-relaxed">
                  The email <span className="text-[#f2ca50] font-semibold">{existingUser?.email || form.email}</span> is already registered on the waitlist as:
                </p>
                <div className="inline-block bg-[#13141a] px-4 py-2.5 rounded-xl border border-[#22242c] mb-6 text-xs text-white">
                  <span className="text-[#f2ca50] font-semibold">{existingUser?.full_name}</span> &middot; <span className="font-medium text-white">{existingUser?.role}</span>
                </div>
                <p className="text-xs sm:text-sm text-white max-w-md mx-auto mb-8 leading-relaxed">
                  Would you like to change your details to <span className="text-[#f2ca50] font-semibold">{form.full_name}</span> (<span className="text-white font-semibold">{form.role}</span>)?
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit("conflict_apply")}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40] text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Yes, Change Details
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#282a33] text-xs font-semibold uppercase tracking-wider text-white hover:text-[#f2ca50] transition-colors"
                  >
                    Keep Existing Details
                  </button>
                </div>
              </div>
            )}

            {(status === "otp_pending" || status === "otp_sending" || status === "otp_verifying") && (
              <div className="text-center py-6 sm:py-10 px-2 sm:px-4 max-w-lg mx-auto">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <ShieldCheck size={28} color={C.gold} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium mb-2.5">
                  Verify It's You
                </h3>
                <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto mb-6 leading-relaxed">
                  To protect your waitlist spot, we sent a 6-digit code to <span className="text-[#f2ca50] font-semibold">{form.email}</span>.
                </p>

                {serverError && (
                  <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200">
                    {serverError}
                  </div>
                )}

                {otpError && (
                  <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200">
                    {otpError}
                  </div>
                )}

                {status === "otp_sending" ? (
                  <div className="flex flex-col items-center justify-center py-6 text-sm text-[#f2ca50] gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Sending verification code to your email...</span>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <label className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-white/70 block mb-2">
                        6-DIGIT VERIFICATION CODE
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtp(val);
                        }}
                        className="w-full text-center tracking-[0.5em] text-2xl font-mono bg-[#13141a] text-white px-4 py-3.5 rounded-xl border border-[#22242c] focus:border-[#f2ca50] outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={otp.trim().length !== 6 || status === "otp_verifying"}
                        className={`w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                          otp.trim().length === 6 && status !== "otp_verifying"
                            ? "bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40]"
                            : "bg-[#22242c] text-white/50 cursor-not-allowed"
                        }`}
                      >
                        {status === "otp_verifying" ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            <span>Verifying...</span>
                          </>
                        ) : targetAction === "conflict_apply" ? (
                          "Verify & Update Details"
                        ) : (
                          "Verify & Continue"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={otpResendCountdown > 0}
                        className={`w-full sm:w-auto px-5 py-3 rounded-full border text-xs font-semibold uppercase tracking-wider transition-colors ${
                          otpResendCountdown > 0
                            ? "border-[#282a33] text-white/40 cursor-not-allowed"
                            : "border-[#282a33] text-white hover:text-[#f2ca50] hover:border-[#f2ca50]/40"
                        }`}
                      >
                        {otpResendCountdown > 0 ? `Resend in ${otpResendCountdown}s` : "Resend code"}
                      </button>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={reset}
                        className="text-xs text-white/60 hover:text-white transition-colors"
                      >
                        Cancel and return to waitlist
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {status === "updated" && (
              <div className="text-center py-8 sm:py-12 px-2 sm:px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <CheckCircle2 size={28} color={C.gold} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl sm:text-4xl text-white font-medium mb-2.5 sm:mb-3">
                  Details Updated! 🎉
                </h3>
                <p className="text-xs sm:text-sm text-white max-w-md mx-auto mb-6 leading-relaxed">
                  Your waitlist profile has been successfully updated to <span className="text-[#f2ca50] font-semibold">{form.role}</span> for <span className="text-[#f2ca50] font-semibold">{form.email}</span>.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="px-6 py-3 rounded-full bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40] text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {(status === "edit_mode" || status === "updating") && (
            <form onSubmit={handleUpdate} noValidate className="space-y-6 sm:space-y-8">
              {serverError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200">
                  {serverError}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <label className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-white">
                    01 / SELECT YOUR UPDATED ROLE *
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const pressed = form.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`group p-3.5 sm:p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          pressed
                            ? "bg-[#181a22] border-[#f2ca50]"
                            : "bg-[#13141a] border-[#22242c] text-white hover:border-[#383a44]"
                        }`}
                        onClick={() => setRole(r.id)}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <Icon size={17} color={pressed ? C.gold : undefined} />
                          {pressed && <CheckCircle2 size={14} className="text-[#f2ca50]" />}
                        </div>
                        <span className="font-serif text-sm font-semibold block" style={{ color: pressed ? C.gold : "#ffffff" }}>
                          {r.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white block mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grace Kiptum"
                    value={form.full_name}
                    onChange={setField("full_name")}
                    onBlur={blur("full_name")}
                    className="w-full bg-[#13141a] text-white px-4 py-3 rounded-xl border border-[#22242c] focus:border-[#f2ca50] outline-none text-xs sm:text-sm transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-white block">
                      Email Address (Verified)
                    </label>
                    <span className="text-[10px] text-[#f2ca50] flex items-center gap-1 font-mono">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </div>
                  <input
                    type="email"
                    disabled
                    value={form.email}
                    className="w-full bg-[#13141a]/60 text-white/80 px-4 py-3 rounded-xl border border-[#22242c] cursor-not-allowed outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit || status === "updating"}
                  className={`w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 ${
                    canSubmit && status !== "updating"
                      ? "bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40]"
                      : "bg-[#22242c] text-white/50"
                  }`}
                >
                  {status === "updating" ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Updating details...</span>
                    </>
                  ) : (
                    "Save Updated Details"
                  )}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="w-full sm:w-auto px-5 py-3 rounded-full border border-[#282a33] text-xs font-semibold uppercase tracking-wider text-white hover:text-[#f2ca50] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}


          {(status === "idle" || status === "loading" || status === "error") && (
            <form onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-8">
              {serverError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200">
                  {serverError}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <label className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-white">
                    01 / SELECT YOUR ROLE *
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const pressed = form.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`group p-3.5 sm:p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          pressed
                            ? "bg-[#181a22] border-[#f2ca50]"
                            : "bg-[#13141a] border-[#22242c] text-white hover:border-[#383a44]"
                        }`}
                        onClick={() => setRole(r.id)}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <Icon size={17} color={pressed ? C.gold : undefined} />
                          {pressed && <CheckCircle2 size={14} className="text-[#f2ca50]" />}
                        </div>
                        <span className="font-serif text-sm font-semibold block" style={{ color: pressed ? C.gold : "#ffffff" }}>
                          {r.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white block mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grace Kiptum"
                    value={form.full_name}
                    onChange={setField("full_name")}
                    onBlur={blur("full_name")}
                    className="w-full bg-[#13141a] text-white px-4 py-3 rounded-xl border border-[#22242c] focus:border-[#f2ca50] outline-none text-xs sm:text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={setField("email")}
                    onBlur={blur("email")}
                    className="w-full bg-[#13141a] text-white px-4 py-3 rounded-xl border border-[#22242c] focus:border-[#f2ca50] outline-none text-xs sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="submit"
                  disabled={!canSubmit || status === "loading"}
                  className={`px-6 py-3 rounded-full text-xs font-bold uppercase transition-colors ${
                    canSubmit && status !== "loading"
                      ? "bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40]"
                      : "bg-[#22242c] text-white/50"
                  }`}
                >
                  {status === "loading" ? "Joining waitlist..." : "Join Waitlist"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="w-full bg-[#111318] border-t border-[#282a2f] py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <BrandLogo size={20} />
        <p className="text-xs text-white">
          &copy; {new Date().getFullYear()} ALIMERIQ &middot; alimeriq.app &middot; All rights reserved.
        </p>
      </div>
    </footer>
  );
}
