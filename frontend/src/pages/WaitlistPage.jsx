/**
 * pages/WaitlistPage.jsx — Main waitlist landing page for ALIMERIQ.
 *
 * Implements high-end visual design and accessibility standards:
 * - Fraunces serif + Plus Jakarta Sans typography
 * - Double-bezel card wrappers
 * - Draft autosave via useWaitlist hook
 * - Screen-reader aria-live result region
 */
import { useRef, useCallback } from "react";
import {
  ArrowRight, CheckCircle2, Loader2,
  Building2, TrendingUp, Briefcase, Truck,
  Sparkles, Globe2, ShieldCheck, Zap, Users,
} from "lucide-react";
import { useWaitlist } from "../hooks/useWaitlist";
import { FormSkeleton } from "../components/Skeletons";

const C = {
  bg: "#0A0A0B",
  surface: "#141417",
  surface2: "#1C1C21",
  border: "#2B2B31",
  gold: "#C9A15A",
  goldSoft: "rgba(201,161,90,0.12)",
  goldBorder: "rgba(201,161,90,0.35)",
  emerald: "#3E8368",
  rust: "#B5573F",
  text: "#F3F1EC",
  muted: "#9B9A94",
  faint: "#5F5E5A",
};

const ROLES = [
  { id: "Founder", icon: Building2, color: "#C9A15A", desc: "Start & grow your company" },
  { id: "Investor", icon: TrendingUp, color: "#3E8368", desc: "Back the next big thing" },
  { id: "Job Seeker", icon: Briefcase, color: "#7C6FCD", desc: "Find your startup role" },
  { id: "Infrastructure Provider", icon: Truck, color: "#B5573F", desc: "Supply what startups need" },
];

const FEATURES = [
  { icon: Building2, color: "#C9A15A", title: "AI-guided company building", body: "Founders get a step-by-step AI co-pilot — from idea validation and market analysis to business plans, MVP scoping, and legal registration." },
  { icon: TrendingUp, color: "#3E8368", title: "Investor deal-flow, simplified", body: "Browse vetted startups across every industry, invest in a few taps, and manage your entire portfolio with built-in digital deal signing." },
  { icon: Users, color: "#7C6FCD", title: "Talent marketplace for startups", body: "Founders post roles and get matched to the right talent. Job seekers get discovered by fast-growing startups without the CV black hole." },
  { icon: Truck, color: "#B5573F", title: "Infrastructure you can rent", body: "Need trucks, servers, satellites, or cold storage? Infrastructure providers list assets and startups lease exactly what they need." },
  { icon: ShieldCheck, color: "#C9A15A", title: "Legal & compliance built in", body: "Register your company, file trademarks, sign NDAs, and manage data-protection policies — all within ALIMERIQ." },
  { icon: Globe2, color: "#3E8368", title: "Built for emerging markets", body: "Designed for founders across Africa, Asia, and beyond — with local payment methods, multi-currency support, and offline-resilient design." },
];

const STATS = [
  { value: "4", label: "Roles on platform" },
  { value: "20+", label: "Industries covered" },
  { value: "50+", label: "Countries targeted" },
  { value: "∞", label: "Deals all in one place" },
];

function Logo({ size = 24 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <polygon points="20,2 37,20 20,38 3,20" fill="none" stroke={C.gold} strokeWidth="2.2" />
        <text x="20" y="26" textAnchor="middle" fontSize="16" fill={C.gold} fontFamily="Georgia,serif">A</text>
      </svg>
      <span style={{ fontFamily: "Fraunces, Georgia, serif", color: C.text, fontSize: size * 0.75, letterSpacing: 1 }}>
        ALIMERIQ
      </span>
    </div>
  );
}

function NavBar() {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
        zIndex: 100, width: "min(680px, calc(100% - 32px))",
        background: "rgba(20,20,23,0.85)",
        border: `1px solid ${C.border}`,
        borderRadius: 999,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <Logo size={20} />
      <a
        href="#waitlist"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13, fontWeight: 700,
          background: C.gold, color: "#161410",
          padding: "9px 20px", borderRadius: 999,
          textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 6,
          transition: "opacity 0.2s",
        }}
      >
        Join Waitlist <ArrowRight size={13} aria-hidden="true" />
      </a>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{
      minHeight: "85vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "120px 24px 60px", position: "relative", zIndex: 1,
      textAlign: "center",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        border: `1px solid ${C.goldBorder}`, borderRadius: 999,
        padding: "6px 16px", marginBottom: 28, background: C.goldSoft,
      }}>
        <Sparkles size={12} color={C.gold} aria-hidden="true" />
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, letterSpacing: 2, fontWeight: 700, color: C.gold }}>
          NOW ACCEPTING EARLY ACCESS
        </span>
      </div>

      <h1 style={{
        fontFamily: "Fraunces, Georgia, serif",
        fontSize: "clamp(38px, 7vw, 78px)",
        fontWeight: 500, lineHeight: 1.1,
        color: C.text, marginBottom: 24,
        maxWidth: 820, letterSpacing: "-0.02em",
        textWrap: "balance",
      }}>
        One platform to build, fund,{" "}
        <span style={{ background: `linear-gradient(120deg, ${C.gold}, #E8D6A8)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          hire, and scale
        </span>{" "}
        your company.
      </h1>

      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(15px, 2vw, 18px)", color: C.muted, lineHeight: 1.75, maxWidth: 580, marginBottom: 44 }}>
        ALIMERIQ connects <strong style={{ color: C.text }}>founders</strong>,{" "}
        <strong style={{ color: C.text }}>investors</strong>,{" "}
        <strong style={{ color: C.text }}>job seekers</strong>, and{" "}
        <strong style={{ color: C.text }}>infrastructure providers</strong> — everything your startup needs in one place.
      </p>

      <a
        href="#waitlist"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: C.gold, color: "#161410",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 15, fontWeight: 700,
          padding: "15px 32px", borderRadius: 999,
          textDecoration: "none",
        }}
      >
        Request early access
        <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowRight size={14} color="#161410" />
        </span>
      </a>
    </section>
  );
}

function WaitlistFormSection() {
  const { form, touched, status, serverError, canSubmit, setField, setRole, blur, submit, reset } = useWaitlist();
  const resultRef = useRef(null);

  const handleSubmit = async (e) => {
    await submit(e);
    setTimeout(() => resultRef.current?.focus(), 80);
  };

  return (
    <section id="waitlist" aria-labelledby="waitlist-heading" style={{ padding: "80px 24px 120px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, letterSpacing: 2, color: C.gold, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>JOIN THE WAITLIST</p>
        <h2 id="waitlist-heading" style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(28px,4vw,44px)", color: C.text, textAlign: "center", marginBottom: 14, fontWeight: 500, letterSpacing: "-0.02em", textWrap: "balance" }}>
          Be the first in.
        </h2>
        <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 14.5, textAlign: "center", marginBottom: 44, lineHeight: 1.7 }}>
          We're opening access in waves. Sign up now and get a confirmation email — plus an early look once we're live.
        </p>

        {/* Double-bezel card wrapper */}
        <div style={{ background: "#0D0D0F", border: `1px solid ${C.border}`, borderRadius: 24, padding: 6 }}>
          <div style={{ background: C.surface, border: "1px solid #222226", borderRadius: 20, padding: "32px 28px" }}>

            <div
              ref={resultRef}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              tabIndex={-1}
              style={{ outline: "none" }}
            >
              {status === "success" && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(62,131,104,0.12)", border: "1px solid rgba(62,131,104,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <CheckCircle2 size={30} color="#3E8368" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 22, color: C.text, fontWeight: 500, marginBottom: 10 }}>
                    You're on the list, {form.full_name.split(" ")[0]}!
                  </h3>
                  <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 6 }}>
                    A confirmation email is heading to
                  </p>
                  <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, color: C.gold, fontWeight: 600, marginBottom: 20 }}>{form.email}</p>
                  <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: C.faint, lineHeight: 1.6 }}>
                    We'll reach out when ALIMERIQ goes live. Keep building. 🚀
                  </p>
                </div>
              )}

              {status === "duplicate" && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.goldSoft, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Zap size={28} color={C.gold} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 22, color: C.text, fontWeight: 500, marginBottom: 10 }}>Already in!</h3>
                  <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
                    <span style={{ color: C.gold }}>{form.email}</span> is already on the ALIMERIQ waitlist. We'll be in touch soon.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", color: C.muted, fontSize: 13, cursor: "pointer", minHeight: 44 }}
                  >
                    Use a different email
                  </button>
                </div>
              )}
            </div>

            {(status === "idle" || status === "loading" || status === "error") && (
              <form id="waitlist-form" onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="waitlist-name"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", display: "block", fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}
                  >
                    FULL NAME <span aria-hidden="true" style={{ color: C.rust }}>*</span>
                  </label>
                  <input
                    id="waitlist-name"
                    name="full_name"
                    type="text"
                    className="alq-input"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    enterKeyHint="next"
                    placeholder="e.g. Grace Kiptum"
                    value={form.full_name}
                    onChange={setField("full_name")}
                    onBlur={blur("full_name")}
                    aria-required="true"
                    aria-describedby={touched.full_name && !form.full_name.trim() ? "name-error" : undefined}
                  />
                  {touched.full_name && !form.full_name.trim() && (
                    <p id="name-error" role="alert" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.rust, marginTop: 6 }}>
                      Please enter your full name.
                    </p>
                  )}
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="waitlist-email"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", display: "block", fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}
                  >
                    EMAIL ADDRESS <span aria-hidden="true" style={{ color: C.rust }}>*</span>
                  </label>
                  <input
                    id="waitlist-email"
                    name="email"
                    type="email"
                    className="alq-input"
                    required
                    maxLength={254}
                    autoComplete="email"
                    enterKeyHint="next"
                    inputMode="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={setField("email")}
                    onBlur={blur("email")}
                    aria-required="true"
                    aria-describedby={touched.email && !form.email.includes("@") ? "email-error" : undefined}
                  />
                  {touched.email && !form.email.includes("@") && (
                    <p id="email-error" role="alert" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.rust, marginTop: 6 }}>
                      Please enter a valid email address.
                    </p>
                  )}
                </div>

                {/* Role */}
                <fieldset style={{ border: "none", padding: 0, marginBottom: 28 }}>
                  <legend style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}>
                    I AM A… <span aria-hidden="true" style={{ color: C.rust }}>*</span>
                  </legend>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const pressed = form.role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          id={`role-${r.id.toLowerCase().replace(/\s+/g, "-")}`}
                          className="role-btn"
                          aria-pressed={pressed}
                          onClick={() => setRole(r.id)}
                          style={{
                            color: pressed ? r.color : C.muted,
                            background: pressed ? `${r.color}12` : C.surface2,
                            borderColor: pressed ? r.color : C.border,
                          }}
                        >
                          <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                          {r.id}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {status === "error" && serverError && (
                  <p id="server-error" role="alert" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: C.rust, marginBottom: 16, lineHeight: 1.5 }}>
                    {serverError}
                  </p>
                )}

                <button
                  id="waitlist-submit"
                  type="submit"
                  className="alq-submit"
                  aria-disabled={(!canSubmit || status === "loading") ? "true" : "false"}
                  onClick={(e) => { if (!canSubmit || status === "loading") e.preventDefault(); }}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={16} className="alq-spinner" aria-hidden="true" />
                      <span className="visually-hidden">Joining the waitlist…</span>
                      <span aria-hidden="true">Joining…</span>
                    </>
                  ) : (
                    <>
                      Join the waitlist
                      <ArrowRight size={15} aria-hidden="true" />
                    </>
                  )}
                </button>

                <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11.5, color: C.faint, textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                  No spam. We'll only email you when ALIMERIQ goes live.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WaitlistPage() {
  return (
    <>
      <NavBar />
      <Hero />
      <section aria-labelledby="roles-heading" style={{ padding: "80px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, letterSpacing: 2, color: C.gold, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>WHO IT'S FOR</p>
          <h2 id="roles-heading" style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(28px,4vw,44px)", color: C.text, textAlign: "center", marginBottom: 16, fontWeight: 500, letterSpacing: "-0.02em", textWrap: "balance" }}>
            Every player. One ecosystem.
          </h2>
          <ul role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, listStyle: "none", padding: 0, marginTop: 40 }}>
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <li key={r.id}>
                  <article style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px 24px", height: "100%" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${r.color}15`, border: `1px solid ${r.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <Icon size={22} color={r.color} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <h3 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 18, color: C.text, fontWeight: 500, marginBottom: 8 }}>{r.id}</h3>
                    <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{r.desc}</p>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-labelledby="features-heading" style={{ padding: "80px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, letterSpacing: 2, color: C.gold, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>PLATFORM FEATURES</p>
          <h2 id="features-heading" style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(28px,4vw,44px)", color: C.text, textAlign: "center", marginBottom: 16, fontWeight: 500, letterSpacing: "-0.02em", textWrap: "balance" }}>
            Everything under one roof.
          </h2>
          <ul role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, listStyle: "none", padding: 0, marginTop: 40 }}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title}>
                  <article style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px 26px", height: "100%" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}12`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Icon size={20} color={f.color} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <h3 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 17, color: C.text, fontWeight: 500, marginBottom: 10 }}>{f.title}</h3>
                    <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{f.body}</p>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-label="Platform statistics" style={{ padding: "60px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 32 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div aria-hidden="true" style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 40, color: C.gold, fontWeight: 500, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.muted, marginTop: 6, letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <WaitlistFormSection />

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "32px 24px", position: "relative", zIndex: 1, textAlign: "center" }}>
        <Logo size={18} />
        <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.faint, marginTop: 12 }}>
          &copy; {new Date().getFullYear()} ALIMERIQ &middot; alimeriq.app &middot; All rights reserved.
        </p>
      </footer>
    </>
  );
}
