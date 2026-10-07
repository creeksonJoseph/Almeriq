/**
 * Pages/LandingPage.jsx - Primary Landing & Waitlist Page for ALIMERIQ.
 */
import React, { useRef, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Building2,
  TrendingUp,
  Briefcase,
  Truck,
  Globe2,
  Lock,
  User,
  Mail,
} from "lucide-react";
import { useWaitlist } from "../hooks/useWaitlist";
import BrandLogo from "../components/BrandLogo";

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
  muted: "#ffffff",
  outline: "#ffffff",
  rust: "#ffb4ab",
};

const ROLES = [
  { id: "Founder", icon: Building2, color: C.gold, desc: "AI startup co-pilot, investor exposure, hiring & infrastructure" },
  { id: "Investor", icon: TrendingUp, color: C.gold, desc: "Vetted deal flow, live founder metrics & investment tracking" },
  { id: "Job Seeker", icon: Briefcase, color: C.gold, desc: "Direct founder hiring, startup roles & transparent equity" },
  { id: "Infrastructure Provider", icon: Truck, color: C.gold, desc: "Monetize compute, cold storage, servers & logistics assets" },
];

const CAPABILITIES = [
  {
    num: "01",
    color: C.gold,
    title: "AI-Guided Venture Builder",
    desc: "Founders get a step-by-step AI co-pilot - from idea validation and market sizing to business plans, MVP scoping, and company registration."
  },
  {
    num: "02",
    color: C.gold,
    title: "Curated Investor Deal Flow",
    desc: "Browse vetted startups across 20+ sectors, review transparent founder metrics, and participate in startup syndicates."
  },
  {
    num: "03",
    color: C.gold,
    title: "Borderless Startup Talent Network",
    desc: "Founders post roles and match with top engineers, growth leaders, and operators. Job seekers apply directly without recruiter black holes."
  },
  {
    num: "04",
    color: C.gold,
    title: "Physical & Cloud Infrastructure Leasing",
    desc: "Need servers, cold storage, warehousing, or trucks? Infrastructure providers list assets and startups lease exactly what they need."
  },
  {
    num: "05",
    color: C.gold,
    title: "Legal & Compliance Infrastructure",
    desc: "Streamlined company registration, trademark filings, mutual NDAs, and compliance guidelines across global startup hubs."
  },
  {
    num: "06",
    color: C.gold,
    title: "Emerging Market Payment Rails",
    desc: "Built for founders across Africa, Asia, and Latin America with multi-currency clearing (KES, INR, BRL, AED, USD) and resilient UX."
  }
];

function Hero() {
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

function EcosystemSection() {
  return (
    <section id="ecosystem" className="w-full bg-[#111318] py-12 sm:py-16 lg:py-20 border-b border-[#1e2025]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 sm:pb-12">
          <div>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl text-white font-medium">Four Stakeholders. One Ecosystem.</h2>
          </div>
          <p className="text-xs sm:text-sm text-white max-w-md mt-3 md:mt-0 leading-relaxed">
            Replacing fragmented tools with a single unified platform where capital, talent, founders, and physical assets connect.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-[#282a2f] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Founders</h3>
              <p className="text-xs text-white leading-relaxed">
                Venture building accelerated by an AI co-pilot. From idea validation and business plans to investor exposure, hiring, and renting infrastructure.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Investors</h3>
              <p className="text-xs text-white leading-relaxed">
                Vetted startup deal flow with real-time operational telemetry. Evaluate founders, participate in syndicates, and track portfolios.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Job Seekers</h3>
              <p className="text-xs text-white leading-relaxed">
                Direct access to fast-growing startups without recruiter black holes. Showcase your skills and land key roles.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2.5 sm:mb-3">Asset Lessors</h3>
              <p className="text-xs text-white leading-relaxed">
                Monetize servers, compute clusters, cold storage, warehousing, and trucks. Lease assets directly to startups.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
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

function WaitlistFormSection() {
  const { form, touched, status, serverError, canSubmit, setField, setRole, blur, submit, reset } = useWaitlist();
  const resultRef = useRef(null);

  const handleSubmit = async (e) => {
    await submit(e);
    setTimeout(() => resultRef.current?.focus(), 80);
  };

  return (
    <section id="access-console" className="w-full bg-[#0c0e13] py-12 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10 lg:mb-12">
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-medium mb-2.5 sm:mb-4">
            Join the ALIMERIQ Network
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-white leading-relaxed">
            Select your role to join the waitlist.
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
                <button
                  type="button"
                  onClick={reset}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[#282a33] text-xs font-semibold uppercase tracking-wider text-white hover:text-[#f2ca50]"
                >
                  Register another team member
                </button>
              </div>
            )}
          </div>

          {(status === "idle" || status === "loading" || status === "error") && (
            <form onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-8">
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

function Footer() {
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

export default function LandingPage() {
  useEffect(() => {
    if (window.location.hash === "#access-console") {
      setTimeout(() => {
        const el = document.getElementById("access-console");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="w-full bg-[#0c0e13] text-white font-sans antialiased">
      <Hero />
      <EcosystemSection />
      <CapabilitiesSection />
      <WaitlistFormSection />
      <Footer />
    </div>
  );
}

