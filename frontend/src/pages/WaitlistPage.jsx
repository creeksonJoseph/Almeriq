/**
 * pages/WaitlistPage.jsx — Strict 2-accent luxury design for ALIMERIQ.
 *
 * Color discipline:
 * - Primary accent: Champagne Gold (#f2ca50) reserved for brand, CTAs, focus, and metrics.
 * - Monochrome base: Obsidian (#0c0e13 / #111318) + Warm White (#e2e2e9) + Muted Gray (#d0c5af).
 * - Zero rainbow/multi-color clutter (all blue, lavender, green, and amber noise removed).
 */
import { useRef } from "react";
import {
  ArrowRight, CheckCircle2, Loader2,
  Building2, TrendingUp, Briefcase, Truck,
  Sparkles, Globe2, ShieldCheck, Zap, Users, Lock,
  ChevronRight, ArrowUpRight, Cpu, Layers, BarChart3,
  User, Mail
} from "lucide-react";
import { useWaitlist } from "../hooks/useWaitlist";

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
  text: "#e2e2e9",
  muted: "#d0c5af",
  outline: "#99907c",
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
    desc: "Founders get a step-by-step AI co-pilot — from idea validation and market sizing to business plans, MVP scoping, and company registration."
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

function BrandLogo({ size = 26 }) {
  return (
    <a href="#" className="flex items-center gap-3 group text-decoration-none">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <polygon points="20,2 37,20 20,38 3,20" fill="none" stroke={C.gold} strokeWidth="2.4" />
        <text x="20" y="26" textAnchor="middle" fontSize="16" fill={C.gold} fontFamily="Georgia, serif" fontWeight="bold">A</text>
      </svg>
      <span className="font-serif text-xl tracking-tight text-white font-semibold group-hover:text-[#f2ca50] transition-colors">
        ALIMERIQ
      </span>
    </a>
  );
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0e13]/85 backdrop-blur-xl border-b border-[#282a2f]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <BrandLogo size={24} />
        </div>

        <div className="flex items-center gap-4">
          <a
            href="#access-console"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-[#f2ca50] text-[#111318] text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-[#d4af37] transition-all shadow-[0_0_24px_-4px_rgba(242,202,80,0.3)] whitespace-nowrap shrink-0"
          >
            Request Early Access
            <ArrowRight size={13} className="shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0c0e13] pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-24 border-b border-[#1e2025]">
      {/* Ambient Radial Golden Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[520px] bg-gradient-to-b from-[#f2ca50]/12 via-[#f2ca50]/4 to-transparent blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col pt-2 sm:pt-4">
        {/* Editorial Headline & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-baseline">
          <div className="lg:col-span-8">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-7xl font-medium tracking-tight text-[#e2e2e9] leading-[1.1]">
              One unified platform to build, fund,{" "}
              <span className="italic text-[#f2ca50]">
                hire, and scale
              </span>{" "}
              your company.
            </h1>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-between self-end">
            <p className="text-sm sm:text-base lg:text-lg text-[#d0c5af] font-light leading-relaxed">
              ALIMERIQ connects <strong className="text-white font-medium">founders</strong>, <strong className="text-white font-medium">investors</strong>, <strong className="text-white font-medium">job seekers</strong>, and <strong className="text-white font-medium">infrastructure providers</strong> into one seamless ecosystem. Everything your venture needs in one place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EcosystemSection() {
  return (
    <section id="ecosystem" aria-labelledby="ecosystem-heading" className="w-full bg-[#111318] py-12 sm:py-16 lg:py-20 border-b border-[#1e2025]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 sm:pb-12">
          <div>
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#f2ca50] block mb-1.5 sm:mb-2">Ecosystem Convergence</span>
            <h2 id="ecosystem-heading" className="font-serif text-2xl sm:text-4xl lg:text-5xl text-[#e2e2e9] font-medium">Four Stakeholders. One Ecosystem.</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#d0c5af] max-w-md mt-3 md:mt-0 leading-relaxed">
            Replacing fragmented tools with a single unified platform where capital, talent, founders, and physical assets connect.
          </p>
        </div>

        {/* 4 Column Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-[#282a2f] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
          {/* 01 Founders */}
          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-4 sm:pb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#f2ca50]">Role 01</span>
                <Building2 size={20} color={C.gold} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#e2e2e9] font-medium mb-2.5 sm:mb-3">Founders</h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed mb-5 sm:mb-6">
                Venture building accelerated by an AI co-pilot. From idea validation and business plans to investor exposure, hiring, and renting infrastructure.
              </p>
              <ul className="space-y-2.5 sm:space-y-3 text-xs text-[#e2e2e9]">
                <li className="flex items-start gap-2.5">
                  <Sparkles size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Step-by-step AI startup co-pilot</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <TrendingUp size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Direct exposure to verified investors</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Users size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Hire startup talent & rent assets</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 sm:pt-8 mt-4 sm:mt-6 border-t border-[#282a2f]">
              <a href="#access-console" className="text-xs font-semibold uppercase tracking-wider text-[#f2ca50] inline-flex items-center gap-1">
                Join as Founder <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 02 Investors */}
          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-4 sm:pb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#f2ca50]">Role 02</span>
                <TrendingUp size={20} color={C.gold} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#e2e2e9] font-medium mb-2.5 sm:mb-3">Investors</h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed mb-5 sm:mb-6">
                Vetted startup deal flow with real-time operational telemetry. Evaluate founders, participate in syndicates, and track portfolios in one place.
              </p>
              <ul className="space-y-2.5 sm:space-y-3 text-xs text-[#e2e2e9]">
                <li className="flex items-start gap-2.5">
                  <BarChart3 size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Transparent startup metrics & data rooms</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Direct founder communication & deal signing</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Layers size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Unified portfolio tracking dashboard</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 sm:pt-8 mt-4 sm:mt-6 border-t border-[#282a2f]">
              <a href="#access-console" className="text-xs font-semibold uppercase tracking-wider text-[#f2ca50] inline-flex items-center gap-1">
                Join as Investor <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 03 Job Seekers */}
          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-4 sm:pb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#f2ca50]">Role 03</span>
                <Briefcase size={20} color={C.gold} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#e2e2e9] font-medium mb-2.5 sm:mb-3">Job Seekers</h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed mb-5 sm:mb-6">
                Direct access to fast-growing startups without recruiter black holes. Showcase your skills and land key roles with transparent equity.
              </p>
              <ul className="space-y-2.5 sm:space-y-3 text-xs text-[#e2e2e9]">
                <li className="flex items-start gap-2.5">
                  <Users size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Direct founder applications & messaging</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Skill-matched roles in seed-stage startups</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Transparent compensation & equity grants</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 sm:pt-8 mt-4 sm:mt-6 border-t border-[#282a2f]">
              <a href="#access-console" className="text-xs font-semibold uppercase tracking-wider text-[#f2ca50] inline-flex items-center gap-1">
                Find Startup Jobs <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 04 Infrastructure Providers */}
          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-4 sm:pb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#f2ca50]">Role 04</span>
                <Truck size={20} color={C.gold} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#e2e2e9] font-medium mb-2.5 sm:mb-3">Asset Lessors</h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed mb-5 sm:mb-6">
                Monetize servers, compute clusters, cold storage, warehousing, and trucks. Lease assets directly to startups with transparent contracts.
              </p>
              <ul className="space-y-2.5 sm:space-y-3 text-xs text-[#e2e2e9]">
                <li className="flex items-start gap-2.5">
                  <Cpu size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>List compute, storage & transport assets</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Truck size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Cold storage & cross-border logistics</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={15} color={C.gold} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Automated platform settlement & leasing</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 sm:pt-8 mt-4 sm:mt-6 border-t border-[#282a2f]">
              <a href="#access-console" className="text-xs font-semibold uppercase tracking-wider text-[#f2ca50] inline-flex items-center gap-1">
                List Assets <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Platform Synergy Preview */}
        <div className="mt-6 sm:mt-8 p-5 sm:p-8 bg-[#1a1b21] rounded-xl sm:rounded-2xl border border-[#282a2f]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-[#282a2f]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-wider uppercase text-[#e2e2e9]">Platform Ecosystem Overview</span>
            </div>
            <span className="text-xs text-[#d0c5af] font-mono">ALL-IN-ONE WORKFLOW</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6">
            <div className="p-4 bg-[#111318] rounded-xl border border-[#282a2f]">
              <span className="text-[11px] uppercase tracking-wider text-[#d0c5af] block mb-1">Founder & Investor Connection</span>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white font-serif">Startup Syndicates</span>
                <span className="text-xs font-semibold text-[#f2ca50]">Direct Match</span>
              </div>
              <div className="w-full bg-[#282a2f] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#f2ca50] h-full w-3/4"></div>
              </div>
              <span className="text-xs text-[#d0c5af] mt-2 block">Connect founders directly with investors</span>
            </div>

            <div className="p-4 bg-[#111318] rounded-xl border border-[#282a2f]">
              <span className="text-[11px] uppercase tracking-wider text-[#d0c5af] block mb-1">Infrastructure Provisioning</span>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white font-serif">Asset Rental Marketplace</span>
                <span className="text-xs font-mono text-[#f2ca50]">Flexible Terms</span>
              </div>
              <div className="w-full bg-[#282a2f] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#f2ca50] h-full w-full"></div>
              </div>
              <span className="text-xs text-[#d0c5af] mt-2 block">Rent compute, storage, and equipment</span>
            </div>

            <div className="p-4 bg-[#111318] rounded-xl border border-[#282a2f]">
              <span className="text-[11px] uppercase tracking-wider text-[#d0c5af] block mb-1">Startup Talent Placement</span>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white font-serif">Key Role Matching</span>
                <span className="text-xs text-[#f2ca50]">Direct Apply</span>
              </div>
              <div className="w-full bg-[#282a2f] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#f2ca50] h-full w-11/12"></div>
              </div>
              <span className="text-xs text-[#d0c5af] mt-2 block">Hire founding engineers and growth leads</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section id="capabilities" aria-labelledby="capabilities-heading" className="w-full bg-[#0c0e13] py-12 sm:py-16 lg:py-20 border-b border-[#1e2025]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#f2ca50] mb-2">Venture Operating System</span>
          <h2 id="capabilities-heading" className="font-serif text-2xl sm:text-4xl lg:text-5xl text-[#e2e2e9] font-medium mb-4 sm:mb-6 leading-tight">
            Institutional capabilities without the friction.
          </h2>
          <p className="text-sm sm:text-base text-[#d0c5af] mb-8 sm:mb-12 font-light leading-relaxed max-w-3xl">
            Legacy startup building relies on disconnected spreadsheets, delayed escrow agents, manual recruiting agencies, and expensive legal brokers. ALIMERIQ replaces this friction with one unified operational platform.
          </p>

          {/* Capabilities List */}
          <div className="flex flex-col divide-y divide-[#282a2f]/60">
            {CAPABILITIES.map((cap) => (
              <div key={cap.num} className="py-5 sm:py-6 first:pt-0 last:pb-0">
                <span className="text-[11px] font-mono font-bold block mb-1.5 sm:mb-2 text-[#f2ca50]">{cap.num} / CAPABILITY</span>
                <h3 className="text-lg sm:text-xl font-semibold text-white font-serif mb-1.5 sm:mb-2">{cap.title}</h3>
                <p className="text-xs sm:text-sm text-[#d0c5af] leading-relaxed font-light">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GlobalImpactSection() {
  return (
    <section id="global-impact" aria-labelledby="global-impact-heading" className="w-full bg-[#111318] py-12 sm:py-16 lg:py-20 border-b border-[#1e2025]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#f2ca50] block mb-1.5 sm:mb-2">Cross-Continental Footprint</span>
          <h2 id="global-impact-heading" className="font-serif text-2xl sm:text-4xl lg:text-5xl text-[#e2e2e9] font-medium">Engineered for Global Growth</h2>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#282a2f] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between">
            <div>
              <span className="font-serif text-4xl sm:text-5xl text-[#f2ca50] block">04</span>
              <span className="font-serif text-base sm:text-lg text-white block mt-3 sm:mt-4">Unified Roles</span>
            </div>
            <p className="text-xs text-[#d0c5af] mt-3 sm:mt-4 leading-relaxed">
              Eliminating friction between founders, investors, operators, and resource providers under one roof.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between">
            <div>
              <span className="font-serif text-4xl sm:text-5xl text-[#f2ca50] block">20+</span>
              <span className="font-serif text-base sm:text-lg text-white block mt-3 sm:mt-4">Active Sectors</span>
            </div>
            <p className="text-xs text-[#d0c5af] mt-3 sm:mt-4 leading-relaxed">
              Spanning fintech, deeptech, agritech, logistics, energy, and AI compute orchestration.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between">
            <div>
              <span className="font-serif text-4xl sm:text-5xl text-[#f2ca50] block">50+</span>
              <span className="font-serif text-base sm:text-lg text-white block mt-3 sm:mt-4">Global Markets</span>
            </div>
            <p className="text-xs text-[#d0c5af] mt-3 sm:mt-4 leading-relaxed">
              Support for high-growth hubs across Africa, Southeast Asia, Middle East, and Latin America with multi-currency clearing.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-[#111318] flex flex-col justify-between">
            <div>
              <span className="font-serif text-4xl sm:text-5xl text-[#f2ca50] block">100%</span>
              <span className="font-serif text-base sm:text-lg text-white block mt-3 sm:mt-4">Digital Compliance</span>
            </div>
            <p className="text-xs text-[#d0c5af] mt-3 sm:mt-4 leading-relaxed">
              Adherence to international compliance standards, trademark filing guidelines, and digital charters.
            </p>
          </div>
        </div>

        {/* Regional Corridors */}
        <div className="mt-6 sm:mt-8 p-5 sm:p-6 bg-[#1a1b21] rounded-xl sm:rounded-2xl border border-[#282a2f] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Globe2 size={28} color={C.gold} aria-hidden="true" className="shrink-0" />
            <div>
              <span className="text-sm sm:text-base font-semibold text-white font-serif block">Frontier Growth Architecture</span>
              <span className="text-xs text-[#d0c5af]">Multi-region connectivity with resilient UX for emerging markets.</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-[#282a2f] rounded text-xs text-[#e2e2e9] font-mono">NAIROBI</span>
            <span className="px-3 py-1 bg-[#282a2f] rounded text-xs text-[#e2e2e9] font-mono">MUMBAI</span>
            <span className="px-3 py-1 bg-[#282a2f] rounded text-xs text-[#e2e2e9] font-mono">SÃO PAULO</span>
            <span className="px-3 py-1 bg-[#282a2f] rounded text-xs text-[#e2e2e9] font-mono">DUBAI</span>
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
    <section id="access-console" aria-labelledby="console-heading" className="w-full bg-[#0c0e13] py-12 sm:py-20 lg:py-28 relative overflow-hidden">
      {/* Ambient Radial Accent */}
      <div className="absolute -bottom-32 right-1/4 w-[600px] h-[400px] bg-[#f2ca50]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Framing Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10 lg:mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/25 text-[10px] font-mono font-bold tracking-[0.2em] text-[#f2ca50] uppercase mb-3 sm:mb-4 shadow-[0_0_15px_rgba(242,202,80,0.1)]">
            ACCESS CONSOLE
          </span>
          <h2 id="console-heading" className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#e2e2e9] font-medium mb-2.5 sm:mb-4">
            Join the ALIMERIQ Network
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-[#d0c5af] font-light leading-relaxed">
            Select your role to request early access — whether you're building a startup, looking to invest, searching for startup roles, or leasing assets.
          </p>
        </div>

        {/* Double-Bezel Hardware Console Outer Shell */}
        <div className="bg-[#0c0e13] p-1.5 sm:p-3.5 border border-[#262832] rounded-2xl sm:rounded-[2.5rem] shadow-2xl relative">
          {/* Inner Core Enclosure */}
          <div className="bg-[#111318] p-4 sm:p-8 lg:p-12 border border-[#20222a] rounded-[calc(1rem-0.25rem)] sm:rounded-[calc(2.5rem-0.75rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
            {/* Top Ambient Hairline Accent */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#f2ca50]/35 to-transparent absolute top-0 left-0" />

            {/* aria-live status region */}
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
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[0_0_30px_rgba(242,202,80,0.2)]">
                    <CheckCircle2 size={28} color={C.gold} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-[#f2ca50]/10 text-[10px] font-mono font-bold tracking-widest text-[#f2ca50] uppercase mb-2.5 sm:mb-3">
                    REGISTRATION CONFIRMED
                  </span>
                  <h3 className="font-serif text-2xl sm:text-4xl text-white font-medium mb-2.5 sm:mb-3">
                    You're on the list, {form.full_name.split(" ")[0]}! 🎉
                  </h3>
                  <p className="text-xs sm:text-sm text-[#d0c5af] leading-relaxed mb-2">
                    A confirmation email has been dispatched to:
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-[#f2ca50] mb-5 sm:mb-6 font-mono">{form.email}</p>
                  <div className="p-3.5 sm:p-4 bg-[#14161e] border border-[#262832] rounded-xl sm:rounded-2xl max-w-md mx-auto text-xs text-[#d0c5af] mb-6 sm:mb-8">
                    Role registered: <strong className="text-white font-medium">{form.role}</strong> &middot; We'll notify you the moment early access opens.
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[#282a33] text-xs font-semibold uppercase tracking-wider text-[#d0c5af] hover:text-white hover:border-[#f2ca50] transition-all"
                  >
                    Register another team member
                  </button>
                </div>
              )}

              {status === "duplicate" && (
                <div className="text-center py-8 sm:py-12 px-2 sm:px-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#f2ca50]/10 text-[10px] font-mono font-bold tracking-widest text-[#f2ca50] uppercase mb-2.5 sm:mb-3">
                    PREVIOUSLY REGISTERED
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium mb-2.5 sm:mb-3">Already Registered!</h3>
                  <p className="text-xs sm:text-sm text-[#d0c5af] leading-relaxed mb-5 sm:mb-6 max-w-md mx-auto">
                    <span className="text-[#f2ca50] font-semibold">{form.email}</span> is already on the ALIMERIQ priority waitlist. We will reach out directly.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[#282a33] text-xs font-semibold uppercase tracking-wider text-[#d0c5af] hover:text-white hover:border-[#f2ca50] transition-colors"
                  >
                    Use a different email address
                  </button>
                </div>
              )}
            </div>

            {(status === "idle" || status === "loading" || status === "error") && (
              <form id="waitlist-form" onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-8">
                {/* Role Selection Group */}
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <label className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#d0c5af]">
                      01 / SELECT YOUR ROLE <span className="text-[#ffb4ab]" aria-hidden="true">*</span>
                    </label>
                    <span className="text-[10px] sm:text-[11px] font-mono text-[#99907c]">Required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const pressed = form.role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          id={`role-${r.id.toLowerCase().replace(/\s+/g, "-")}`}
                          className={`group p-3.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 min-h-[auto] sm:min-h-[110px] relative overflow-hidden ${
                            pressed
                              ? "bg-gradient-to-b from-[#181a22] to-[#12141a] border-[#f2ca50] shadow-[0_0_25px_rgba(242,202,80,0.14)] ring-1 ring-[#f2ca50]/30"
                              : "bg-[#13141a] border-[#22242c] text-[#d0c5af] hover:border-[#3a3d48] hover:bg-[#161820]"
                          }`}
                          aria-pressed={pressed}
                          onClick={() => setRole(r.id)}
                        >
                          {/* Active Top Highlight Line */}
                          {pressed && (
                            <div className="h-0.5 w-full bg-[#f2ca50] absolute top-0 left-0" />
                          )}

                          <div className="flex items-center justify-between w-full mb-2 sm:mb-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors duration-300 ${
                              pressed ? "bg-[#f2ca50]/15 border border-[#f2ca50]/30 text-[#f2ca50]" : "bg-[#1b1d25] border border-[#282a33] text-[#99907c]"
                            }`}>
                              <Icon size={17} color={pressed ? C.gold : undefined} aria-hidden="true" />
                            </div>
                            {pressed ? (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#f2ca50] flex items-center justify-center text-[#111318]">
                                <CheckCircle2 size={12} strokeWidth={3} aria-hidden="true" />
                              </div>
                            ) : (
                              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-[#2e303b] group-hover:border-[#f2ca50]/50 transition-colors" />
                            )}
                          </div>

                          <div>
                            <span className="font-serif text-sm sm:text-base font-semibold block transition-colors" style={{ color: pressed ? C.gold : "#ffffff" }}>
                              {r.id}
                            </span>
                            <p className="text-[10px] sm:text-[11px] text-[#99907c] leading-snug sm:leading-relaxed mt-0.5 sm:mt-1 group-hover:text-[#c5beb0] transition-colors">
                              {r.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Two Column Machined Inputs */}
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <label className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#d0c5af]">
                      02 / IDENTIFICATION DETAILS <span className="text-[#ffb4ab]" aria-hidden="true">*</span>
                    </label>
                    <span className="text-[10px] sm:text-[11px] font-mono text-[#99907c]">Confidential</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Name Input */}
                    <div>
                      <label htmlFor="full-name" className="text-xs font-semibold text-[#d0c5af] block mb-1.5 sm:mb-2">
                        Full Name <span className="text-[#ffb4ab]" aria-hidden="true">*</span>
                      </label>
                      <div className="relative flex items-center group">
                        <div className="absolute left-3.5 sm:left-4 pointer-events-none text-[#99907c] group-focus-within:text-[#f2ca50] transition-colors">
                          <User size={16} aria-hidden="true" />
                        </div>
                        <input
                          id="full-name"
                          name="full_name"
                          type="text"
                          required
                          minLength={2}
                          maxLength={100}
                          autoComplete="name"
                          placeholder="e.g. Grace Kiptum"
                          value={form.full_name}
                          onChange={setField("full_name")}
                          onBlur={blur("full_name")}
                          className="w-full bg-[#0d0e13] text-white pl-10 sm:pl-11 pr-3.5 sm:pr-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border border-[#23252d] text-xs sm:text-sm placeholder-[#55534f] focus:outline-none focus:border-[#f2ca50] focus:ring-2 focus:ring-[#f2ca50]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] transition-all min-h-[46px] sm:min-h-[52px]"
                          aria-required="true"
                          aria-describedby={touched.full_name && !form.full_name.trim() ? "name-error" : undefined}
                        />
                      </div>
                      {touched.full_name && !form.full_name.trim() && (
                        <p id="name-error" role="alert" className="text-xs text-[#ffb4ab] mt-1.5 flex items-center gap-1">
                          <span>Please enter your full name.</span>
                        </p>
                      )}
                    </div>

                    {/* Email Input */}
                    <div>
                      <label htmlFor="work-email" className="text-xs font-semibold text-[#d0c5af] block mb-1.5 sm:mb-2">
                        Email Address <span className="text-[#ffb4ab]" aria-hidden="true">*</span>
                      </label>
                      <div className="relative flex items-center group">
                        <div className="absolute left-3.5 sm:left-4 pointer-events-none text-[#99907c] group-focus-within:text-[#f2ca50] transition-colors">
                          <Mail size={16} aria-hidden="true" />
                        </div>
                        <input
                          id="work-email"
                          name="email"
                          type="email"
                          required
                          maxLength={254}
                          autoComplete="email"
                          inputMode="email"
                          placeholder="you@company.com"
                          value={form.email}
                          onChange={setField("email")}
                          onBlur={blur("email")}
                          className="w-full bg-[#0d0e13] text-white pl-10 sm:pl-11 pr-3.5 sm:pr-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border border-[#23252d] text-xs sm:text-sm placeholder-[#55534f] focus:outline-none focus:border-[#f2ca50] focus:ring-2 focus:ring-[#f2ca50]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] transition-all min-h-[46px] sm:min-h-[52px]"
                          aria-required="true"
                          aria-describedby={touched.email && !form.email.includes("@") ? "email-error" : undefined}
                        />
                      </div>
                      {touched.email && !form.email.includes("@") && (
                        <p id="email-error" role="alert" className="text-xs text-[#ffb4ab] mt-1.5 flex items-center gap-1">
                          <span>Please enter a valid email address.</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Server error message */}
                {status === "error" && serverError && (
                  <div id="server-error" role="alert" className="p-3.5 sm:p-4 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded-lg sm:rounded-xl text-xs text-[#ffb4ab] flex items-center gap-2">
                    <Zap size={16} color="#ffb4ab" className="shrink-0" aria-hidden="true" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Action Bar & CTA Button */}
                <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 border-t border-[#23252e]">
                  <button
                    id="waitlist-submit"
                    type="submit"
                    aria-disabled={(!canSubmit || status === "loading") ? "true" : "false"}
                    onClick={(e) => { if (!canSubmit || status === "loading") e.preventDefault(); }}
                    className={`group w-auto inline-flex items-center justify-between pl-5 sm:pl-8 pr-2 sm:pr-3 py-2.5 sm:py-3.5 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all duration-300 min-h-[42px] sm:min-h-[52px] ${
                      canSubmit && status !== "loading"
                        ? "bg-[#f2ca50] text-[#111318] hover:bg-[#d4af37] shadow-[0_0_32px_rgba(242,202,80,0.25)] cursor-pointer active:scale-[0.98]"
                        : "bg-[#22242c] text-[#787265] cursor-not-allowed"
                    }`}
                  >
                    {status === "loading" ? (
                      <>
                        <span className="visually-hidden">Joining the waitlist…</span>
                        <span>Joining waitlist…</span>
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#111318]/15 flex items-center justify-center ml-2.5 sm:ml-4">
                          <Loader2 size={14} className="animate-spin text-[#111318]" aria-hidden="true" />
                        </div>
                      </>
                    ) : (
                      <>
                        <span>Request Early Access</span>
                        {/* Nested "Button-in-Button" Trailing Icon Island */}
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#111318]/15 flex items-center justify-center ml-2.5 sm:ml-4 group-hover:translate-x-1 group-hover:scale-105 transition-all duration-300">
                          <ArrowRight size={14} className="text-[#111318]" aria-hidden="true" />
                        </div>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-[#99907c] bg-[#14161d] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[#22242c] w-full sm:w-auto">
                    <Lock size={13} color={C.gold} aria-hidden="true" className="shrink-0" />
                    <span>Strict Privacy Guarantee &bull; Direct access when live</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-[#111318] border-t border-[#282a2f] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#f2ca50] block mb-4">Platform</span>
            <ul className="space-y-2 text-xs text-[#d0c5af]">
              <li className="hover:text-white cursor-pointer transition-colors">AI Venture Co-Pilot</li>
              <li className="hover:text-white cursor-pointer transition-colors">Investor Deal Flow</li>
              <li className="hover:text-white cursor-pointer transition-colors">Startup Talent Marketplace</li>
              <li className="hover:text-white cursor-pointer transition-colors">Infrastructure Leasing</li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#f2ca50] block mb-4">Ecosystem Roles</span>
            <ul className="space-y-2 text-xs text-[#d0c5af]">
              <li className="hover:text-white cursor-pointer transition-colors">Founders & Builders</li>
              <li className="hover:text-white cursor-pointer transition-colors">Investors & LPs</li>
              <li className="hover:text-white cursor-pointer transition-colors">Job Seekers & Operators</li>
              <li className="hover:text-white cursor-pointer transition-colors">Infrastructure Partners</li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#f2ca50] block mb-4">Global Regions</span>
            <ul className="space-y-2 text-xs text-[#d0c5af]">
              <li className="hover:text-white cursor-pointer transition-colors">East Africa (Nairobi Hub)</li>
              <li className="hover:text-white cursor-pointer transition-colors">South Asia (Mumbai & GIFT City)</li>
              <li className="hover:text-white cursor-pointer transition-colors">Middle East (Dubai & Abu Dhabi)</li>
              <li className="hover:text-white cursor-pointer transition-colors">Latin America (São Paulo)</li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#f2ca50] block mb-4">Legal & Compliance</span>
            <ul className="space-y-2 text-xs text-[#d0c5af]">
              <li className="hover:text-white cursor-pointer transition-colors">Compliance Framework</li>
              <li className="hover:text-white cursor-pointer transition-colors">Privacy & Data Security</li>
              <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-white cursor-pointer transition-colors">Security Audit Ledger</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#282a2f] flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size={20} />
          <p className="text-xs text-[#99907c]">
            &copy; {new Date().getFullYear()} ALIMERIQ &middot; alimeriq.app &middot; All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-[#0c0e13] text-[#e2e2e9] font-sans antialiased">
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <Hero />
        <EcosystemSection />
        <CapabilitiesSection />
        <GlobalImpactSection />
        <WaitlistFormSection />
      </main>
      <Footer />
    </div>
  );
}
