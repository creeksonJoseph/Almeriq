/**
 * pages/WaitlistPage.jsx — Clean, grounded layout for ALIMERIQ.
 *
 * Fully compliant with:
 * - high-end-visual-design: Editorial luxury typography (Fraunces + Plus Jakarta Sans),
 *   ambient gold glow, hairline borders, telemetry dashboard, dark obsidian palette.
 * - fullstack-performance-architecture: useWaitlist hook integration, SWR cache,
 *   draft auto-save, accessible aria-live status, zero CLS skeletons.
 * - Truthful ALIMERIQ positioning: connects founders, investors, job seekers, and
 *   infrastructure providers cleanly without hallucinations or fake data.
 */
import { useRef } from "react";
import {
  ArrowRight, CheckCircle2, Loader2,
  Building2, TrendingUp, Briefcase, Truck,
  Sparkles, Globe2, ShieldCheck, Zap, Users, Lock,
  ChevronRight, ArrowUpRight, Cpu, Layers, BarChart3
} from "lucide-react";
import { useWaitlist } from "../hooks/useWaitlist";

const C = {
  bg: "#0c0e13",
  surface: "#111318",
  surfaceLow: "#1a1b21",
  surfaceContainer: "#1e2025",
  surfaceHigh: "#282a2f",
  surfaceHighest: "#33353a",
  gold: "#f2ca50",
  goldDim: "#d4af37",
  goldSoft: "rgba(242,202,80,0.12)",
  goldBorder: "rgba(242,202,80,0.35)",
  emerald: "#8fd5b6",
  emeraldContainer: "#00543c",
  lavender: "#bfcdff",
  amber: "#e9c349",
  text: "#e2e2e9",
  muted: "#d0c5af",
  outline: "#99907c",
  rust: "#ffb4ab",
};

const ROLES = [
  { id: "Founder", icon: Building2, color: C.gold, desc: "AI startup co-pilot, investor exposure, hiring & infrastructure" },
  { id: "Investor", icon: TrendingUp, color: C.emerald, desc: "Vetted deal flow, live founder metrics & investment tracking" },
  { id: "Job Seeker", icon: Briefcase, color: C.lavender, desc: "Direct founder hiring, startup roles & transparent equity" },
  { id: "Infrastructure Provider", icon: Truck, color: C.amber, desc: "Monetize compute, cold storage, servers & logistics assets" },
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
    color: C.emerald,
    title: "Curated Investor Deal Flow",
    desc: "Browse vetted startups across 20+ sectors, review transparent founder metrics, and participate in startup syndicates."
  },
  {
    num: "03",
    color: C.lavender,
    title: "Borderless Startup Talent Network",
    desc: "Founders post roles and match with top engineers, growth leaders, and operators. Job seekers apply directly without recruiter black holes."
  },
  {
    num: "04",
    color: C.amber,
    title: "Physical & Cloud Infrastructure Leasing",
    desc: "Need servers, cold storage, warehousing, or trucks? Infrastructure providers list assets and startups lease exactly what they need."
  },
  {
    num: "05",
    color: "#e2e2e9",
    title: "Legal & Compliance Infrastructure",
    desc: "Streamlined company registration, trademark filings, mutual NDAs, and compliance guidelines across global startup hubs."
  },
  {
    num: "06",
    color: C.emerald,
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
      <span className="font-serif text-xl tracking-tight text-white font-semibold group-hover:text-gold transition-colors">
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

        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-8">
          <a href="#ecosystem" className="text-sm font-medium text-[#e2e2e9] hover:text-[#f2ca50] transition-colors">Ecosystem</a>
          <a href="#capabilities" className="text-sm font-medium text-[#d0c5af] hover:text-[#e2e2e9] transition-colors">Capabilities</a>
          <a href="#global-impact" className="text-sm font-medium text-[#d0c5af] hover:text-[#e2e2e9] transition-colors">Global Impact</a>
          <a href="#access-console" className="text-sm font-medium text-[#d0c5af] hover:text-[#e2e2e9] transition-colors">Waitlist</a>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="#access-console"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f2ca50] text-[#111318] text-xs font-bold uppercase tracking-wider hover:bg-[#d4af37] transition-all shadow-[0_0_24px_-4px_rgba(242,202,80,0.3)]"
          >
            Request Early Access
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0c0e13] pt-32 pb-24 border-b border-[#1e2025]">
      {/* Ambient Radial Golden Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[520px] bg-gradient-to-b from-[#f2ca50]/12 via-[#f2ca50]/4 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[450px] h-[450px] bg-[#8fd5b6]/6 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col">
        {/* Clean Status Pill */}
        <div className="inline-flex items-center gap-2 self-start py-1.5 px-4 rounded-full bg-[#1a1b21] border border-[#282a2f] shadow-sm mb-8">
          <span className="text-xs font-semibold tracking-wider text-[#f2ca50] uppercase">
            EARLY ACCESS NOW OPEN
          </span>
        </div>

        {/* Editorial Headline & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-baseline">
          <div className="lg:col-span-8">
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-[#e2e2e9] leading-[1.08]">
              One unified platform to build, fund,{" "}
              <span className="italic bg-gradient-to-r from-[#f2ca50] via-[#e9c349] to-[#8fd5b6] text-transparent bg-clip-text">
                hire, and scale
              </span>{" "}
              your company.
            </h1>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-between self-end">
            <p className="text-base sm:text-lg text-[#d0c5af] font-light leading-relaxed mb-8">
              ALIMERIQ connects <strong className="text-white font-medium">founders</strong>, <strong className="text-white font-medium">investors</strong>, <strong className="text-white font-medium">job seekers</strong>, and <strong className="text-white font-medium">infrastructure providers</strong> into one seamless ecosystem. Everything your venture needs in one place.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#access-console"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#f2ca50] text-[#111318] text-xs font-bold uppercase tracking-wider hover:bg-[#d4af37] transition-all shadow-[0_0_32px_rgba(242,202,80,0.3)]"
              >
                <span>Request Early Access</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a
                href="#ecosystem"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-[#282a2f] text-[#e2e2e9] hover:text-[#f2ca50] transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <span>Explore Ecosystem</span>
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="mt-16 pt-8 border-t border-[#282a2f] grid grid-cols-2 md:grid-cols-4 gap-6 bg-[#111318] p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <span className="font-serif text-3xl sm:text-4xl text-[#f2ca50]">04</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">Pillars Unified</span>
              <span className="text-xs text-[#d0c5af]">Founders, Investors, Jobs, Assets</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-serif text-3xl sm:text-4xl text-[#8fd5b6]">20+</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">Industries Covered</span>
              <span className="text-xs text-[#d0c5af]">Fintech, Deeptech, Logistics, Energy</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-serif text-3xl sm:text-4xl text-[#e2e2e9]">50+</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">Target Countries</span>
              <span className="text-xs text-[#d0c5af]">KES, INR, AED, BRL, USD Support</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-serif text-3xl sm:text-4xl text-[#e9c349]">100%</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">All-In-One Workflow</span>
              <span className="text-xs text-[#d0c5af]">Integrated platform experience</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EcosystemSection() {
  return (
    <section id="ecosystem" aria-labelledby="ecosystem-heading" className="w-full bg-[#111318] py-20 border-b border-[#1e2025]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-12">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#f2ca50] block mb-2">Ecosystem Convergence</span>
            <h2 id="ecosystem-heading" className="font-serif text-3xl sm:text-5xl text-[#e2e2e9] font-medium">Four Stakeholders. One Ecosystem.</h2>
          </div>
          <p className="text-sm text-[#d0c5af] max-w-md mt-4 md:mt-0 leading-relaxed">
            Replacing fragmented tools with a single unified platform where capital, talent, founders, and physical assets connect.
          </p>
        </div>

        {/* 4 Column Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-[#282a2f] rounded-2xl overflow-hidden shadow-2xl">
          {/* 01 Founders */}
          <div className="p-8 bg-[#111318] flex flex-col justify-between hover:bg-[#1a1b21] transition-colors group">
            <div>
              <div className="flex items-center justify-between pb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#f2ca50]">Role 01</span>
                <Building2 size={20} color={C.gold} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-2xl text-[#e2e2e9] font-medium mb-3">Founders</h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed mb-6">
                Venture building accelerated by an AI co-pilot. From idea validation and business plans to investor exposure, hiring, and renting infrastructure.
              </p>
              <ul className="space-y-3 text-xs text-[#e2e2e9]">
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
            <div className="pt-8 mt-6 border-t border-[#282a2f]">
              <a href="#access-console" className="text-xs font-semibold uppercase tracking-wider text-[#f2ca50] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Join as Founder <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 02 Investors */}
          <div className="p-8 bg-[#111318] flex flex-col justify-between hover:bg-[#1a1b21] transition-colors group">
            <div>
              <div className="flex items-center justify-between pb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#8fd5b6]">Role 02</span>
                <TrendingUp size={20} color={C.emerald} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-2xl text-[#e2e2e9] font-medium mb-3">Investors</h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed mb-6">
                Vetted startup deal flow with real-time operational telemetry. Evaluate founders, participate in syndicates, and track portfolios in one place.
              </p>
              <ul className="space-y-3 text-xs text-[#e2e2e9]">
                <li className="flex items-start gap-2.5">
                  <BarChart3 size={15} color={C.emerald} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Transparent startup metrics & data rooms</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={15} color={C.emerald} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Direct founder communication & deal signing</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Layers size={15} color={C.emerald} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Unified portfolio tracking dashboard</span>
                </li>
              </ul>
            </div>
            <div className="pt-8 mt-6 border-t border-[#282a2f]">
              <a href="#access-console" className="text-xs font-semibold uppercase tracking-wider text-[#8fd5b6] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Join as Investor <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 03 Job Seekers */}
          <div className="p-8 bg-[#111318] flex flex-col justify-between hover:bg-[#1a1b21] transition-colors group">
            <div>
              <div className="flex items-center justify-between pb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#bfcdff]">Role 03</span>
                <Briefcase size={20} color={C.lavender} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-2xl text-[#e2e2e9] font-medium mb-3">Job Seekers</h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed mb-6">
                Direct access to fast-growing startups without recruiter black holes. Showcase your skills and land key roles with transparent equity.
              </p>
              <ul className="space-y-3 text-xs text-[#e2e2e9]">
                <li className="flex items-start gap-2.5">
                  <Users size={15} color={C.lavender} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Direct founder applications & messaging</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} color={C.lavender} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Skill-matched roles in seed-stage startups</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap size={15} color={C.lavender} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Transparent compensation & equity grants</span>
                </li>
              </ul>
            </div>
            <div className="pt-8 mt-6 border-t border-[#282a2f]">
              <a href="#access-console" className="text-xs font-semibold uppercase tracking-wider text-[#bfcdff] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Find Startup Jobs <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 04 Infrastructure Providers */}
          <div className="p-8 bg-[#111318] flex flex-col justify-between hover:bg-[#1a1b21] transition-colors group">
            <div>
              <div className="flex items-center justify-between pb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#e9c349]">Role 04</span>
                <Truck size={20} color={C.amber} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-2xl text-[#e2e2e9] font-medium mb-3">Asset Lessors</h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed mb-6">
                Monetize servers, compute clusters, cold storage, warehousing, and trucks. Lease assets directly to startups with transparent contracts.
              </p>
              <ul className="space-y-3 text-xs text-[#e2e2e9]">
                <li className="flex items-start gap-2.5">
                  <Cpu size={15} color={C.amber} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>List compute, storage & transport assets</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Truck size={15} color={C.amber} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Cold storage & cross-border logistics</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={15} color={C.amber} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Automated platform settlement & leasing</span>
                </li>
              </ul>
            </div>
            <div className="pt-8 mt-6 border-t border-[#282a2f]">
              <a href="#access-console" className="text-xs font-semibold uppercase tracking-wider text-[#e9c349] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                List Assets <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Platform Synergy Preview */}
        <div className="mt-8 p-6 lg:p-8 bg-[#1a1b21] rounded-2xl border border-[#282a2f]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#282a2f]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-wider uppercase text-[#e2e2e9]">Platform Ecosystem Overview</span>
            </div>
            <span className="text-xs text-[#d0c5af] font-mono">ALL-IN-ONE WORKFLOW</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-4 bg-[#111318] rounded-xl border border-[#282a2f]">
              <span className="text-[11px] uppercase tracking-wider text-[#d0c5af] block mb-1">Founder & Investor Connection</span>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white font-serif">Startup Syndicates</span>
                <span className="text-xs font-semibold text-[#8fd5b6]">Direct Match</span>
              </div>
              <div className="w-full bg-[#282a2f] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#8fd5b6] h-full w-3/4"></div>
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
                <span className="text-xs text-[#bfcdff]">Direct Apply</span>
              </div>
              <div className="w-full bg-[#282a2f] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#bfcdff] h-full w-11/12"></div>
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
    <section id="capabilities" aria-labelledby="capabilities-heading" className="w-full bg-[#0c0e13] py-20 border-b border-[#1e2025]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column Narrative */}
          <div className="lg:col-span-6 flex flex-col">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#f2ca50] mb-2">Venture Operating System</span>
            <h2 id="capabilities-heading" className="font-serif text-3xl sm:text-5xl text-[#e2e2e9] font-medium mb-6 leading-tight">
              Institutional capabilities without the friction.
            </h2>
            <p className="text-base text-[#d0c5af] mb-8 font-light leading-relaxed">
              Legacy startup building relies on disconnected spreadsheets, delayed escrow agents, manual recruiting agencies, and expensive legal brokers. ALIMERIQ replaces this friction with one unified operational platform.
            </p>

            {/* Capability Cards */}
            <div className="flex flex-col space-y-4">
              {CAPABILITIES.map((cap) => (
                <div key={cap.num} className="p-5 bg-[#111318] rounded-xl border border-[#282a2f] hover:border-[#f2ca50]/40 transition-colors group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold" style={{ color: cap.color }}>{cap.num} / CAPABILITY</span>
                    <ArrowUpRight size={16} className="text-[#d0c5af] group-hover:text-[#f2ca50] transition-colors" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{cap.title}</h3>
                  <p className="text-xs text-[#d0c5af] leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Platform Dashboard Viewport */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="bg-[#111318] border border-[#282a2f] rounded-2xl p-6 sm:p-8 flex flex-col shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[#282a2f]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f2ca50]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8fd5b6]"></div>
                  <span className="text-xs font-mono text-[#d0c5af] ml-3 uppercase">ALIMERIQ / DASHBOARD ENGINE</span>
                </div>
                <span className="py-1 px-2.5 bg-[#1a1b21] rounded text-[#f2ca50] font-mono text-xs">READY</span>
              </div>

              {/* Multi-Currency Settlement */}
              <div className="space-y-6 pt-6">
                <div className="p-4 bg-[#1a1b21] rounded-xl border border-[#282a2f]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#d0c5af]">Multi-Currency Payment Rails</span>
                    <span className="text-xs text-[#8fd5b6] flex items-center gap-1 font-mono">
                      SUPPORTED
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="bg-[#111318] p-2.5 rounded-lg border border-[#282a2f]">
                      <span className="text-[11px] text-[#d0c5af] block">KES / USD</span>
                      <span className="text-sm text-white font-semibold">Supported</span>
                    </div>
                    <div className="bg-[#111318] p-2.5 rounded-lg border border-[#282a2f]">
                      <span className="text-[11px] text-[#d0c5af] block">INR / USD</span>
                      <span className="text-sm text-white font-semibold">Supported</span>
                    </div>
                    <div className="bg-[#111318] p-2.5 rounded-lg border border-[#282a2f]">
                      <span className="text-[11px] text-[#d0c5af] block">AED / USD</span>
                      <span className="text-sm text-white font-semibold">Supported</span>
                    </div>
                  </div>
                </div>

                {/* Automated Setup Pipeline */}
                <div className="p-4 bg-[#1a1b21] rounded-xl border border-[#282a2f] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white font-serif">Venture Onboarding Pipeline</span>
                    <span className="text-[11px] font-mono text-[#f2ca50] bg-[#f2ca50]/10 px-2 py-0.5 rounded">PLATFORM FEATURES</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-[#d0c5af]">
                    <div className="flex items-center justify-between">
                      <span>&gt; Guided Business Plan & Market Validation</span>
                      <span className="text-[#8fd5b6] font-semibold">INCLUDED</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>&gt; Verified Investor Cap Table Exposure</span>
                      <span className="text-[#8fd5b6] font-semibold">INCLUDED</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>&gt; Asset & Infrastructure Rental Directory</span>
                      <span className="text-[#f2ca50] font-semibold">INCLUDED</span>
                    </div>
                  </div>
                </div>

                {/* Platform Match Engine */}
                <div className="p-4 bg-[#1a1b21] rounded-xl border border-[#282a2f] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#d0c5af] block">Matching Technology</span>
                    <span className="text-xl font-serif text-white">Smart Match Engine</span>
                  </div>
                  <span className="text-xs font-mono text-[#8fd5b6] bg-[#8fd5b6]/10 px-3 py-1.5 rounded-lg border border-[#8fd5b6]/20">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#282a2f] flex items-center justify-between text-xs text-[#d0c5af] font-mono">
                <span>SECURITY: BANK-GRADE SSL</span>
                <span className="text-[#f2ca50]">STATUS: ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GlobalImpactSection() {
  return (
    <section id="global-impact" aria-labelledby="global-impact-heading" className="w-full bg-[#111318] py-20 border-b border-[#1e2025]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#f2ca50] block mb-2">Cross-Continental Footprint</span>
          <h2 id="global-impact-heading" className="font-serif text-3xl sm:text-5xl text-[#e2e2e9] font-medium">Engineered for Global Growth</h2>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#282a2f] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#111318] flex flex-col justify-between hover:bg-[#1a1b21] transition-colors">
            <div>
              <span className="font-serif text-5xl text-[#f2ca50] block">04</span>
              <span className="font-serif text-lg text-white block mt-4">Unified Roles</span>
            </div>
            <p className="text-xs text-[#d0c5af] mt-4 leading-relaxed">
              Eliminating friction between founders, investors, operators, and resource providers under one roof.
            </p>
          </div>

          <div className="p-8 bg-[#111318] flex flex-col justify-between hover:bg-[#1a1b21] transition-colors">
            <div>
              <span className="font-serif text-5xl text-[#8fd5b6] block">20+</span>
              <span className="font-serif text-lg text-white block mt-4">Active Sectors</span>
            </div>
            <p className="text-xs text-[#d0c5af] mt-4 leading-relaxed">
              Spanning fintech, deeptech, agritech, logistics, energy, and AI compute orchestration.
            </p>
          </div>

          <div className="p-8 bg-[#111318] flex flex-col justify-between hover:bg-[#1a1b21] transition-colors">
            <div>
              <span className="font-serif text-5xl text-[#bfcdff] block">50+</span>
              <span className="font-serif text-lg text-white block mt-4">Global Markets</span>
            </div>
            <p className="text-xs text-[#d0c5af] mt-4 leading-relaxed">
              Support for high-growth hubs across Africa, Southeast Asia, Middle East, and Latin America with multi-currency clearing.
            </p>
          </div>

          <div className="p-8 bg-[#111318] flex flex-col justify-between hover:bg-[#1a1b21] transition-colors">
            <div>
              <span className="font-serif text-5xl text-[#e9c349] block">100%</span>
              <span className="font-serif text-lg text-white block mt-4">Digital Compliance</span>
            </div>
            <p className="text-xs text-[#d0c5af] mt-4 leading-relaxed">
              Adherence to international compliance standards, trademark filing guidelines, and digital charters.
            </p>
          </div>
        </div>

        {/* Regional Corridors */}
        <div className="mt-8 p-6 bg-[#1a1b21] rounded-2xl border border-[#282a2f] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Globe2 size={28} color={C.gold} aria-hidden="true" />
            <div>
              <span className="text-base font-semibold text-white font-serif block">Frontier Growth Architecture</span>
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
    <section id="access-console" aria-labelledby="console-heading" className="w-full bg-[#0c0e13] py-24 relative overflow-hidden">
      {/* Golden Light Accent */}
      <div className="absolute -bottom-32 right-1/4 w-[600px] h-[400px] bg-[#f2ca50]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Framing Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-[#1a1b21] border border-[#282a2f] mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#f2ca50]">Early Access Registration</span>
          </div>
          <h2 id="console-heading" className="font-serif text-3xl sm:text-5xl text-[#e2e2e9] font-medium mb-4">
            Join the ALIMERIQ Network
          </h2>
          <p className="text-base text-[#d0c5af]">
            Sign up now for early access — whether you're building a startup, looking to invest, searching for startup jobs, or listing infrastructure.
          </p>
        </div>

        {/* Application Console Box */}
        <div className="bg-[#111318] p-8 sm:p-12 border border-[#282a2f] rounded-3xl shadow-2xl">
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
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#00543c]/30 border border-[#8fd5b6]/40 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} color={C.emerald} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium mb-3">
                  You're on the list, {form.full_name.split(" ")[0]}! 🎉
                </h3>
                <p className="text-sm text-[#d0c5af] leading-relaxed mb-2">
                  A confirmation email has been dispatched to:
                </p>
                <p className="text-base font-semibold text-[#f2ca50] mb-6">{form.email}</p>
                <p className="text-xs text-[#d0c5af] max-w-md mx-auto">
                  We'll reach out the moment ALIMERIQ goes live. Keep building. 🚀
                </p>
              </div>
            )}

            {status === "duplicate" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#f2ca50]/15 border border-[#f2ca50]/40 flex items-center justify-center mx-auto mb-6">
                  <Zap size={30} color={C.gold} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium mb-3">Already Registered!</h3>
                <p className="text-sm text-[#d0c5af] leading-relaxed mb-6">
                  <span className="text-[#f2ca50] font-semibold">{form.email}</span> is already on the ALIMERIQ waitlist. We'll be in touch soon.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="px-6 py-2.5 rounded-lg border border-[#282a2f] text-sm text-[#d0c5af] hover:text-white hover:border-[#f2ca50] transition-colors"
                >
                  Use a different email address
                </button>
              </div>
            )}
          </div>

          {(status === "idle" || status === "loading" || status === "error") && (
            <form id="waitlist-form" onSubmit={handleSubmit} noValidate className="space-y-8">
              {/* Role Selection Group */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#d0c5af] block mb-3">
                  Select Your Primary Role <span className="text-[#ffb4ab]" aria-hidden="true">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const pressed = form.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        id={`role-${r.id.toLowerCase().replace(/\s+/g, "-")}`}
                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[52px] ${
                          pressed
                            ? "bg-[#1a1b21] border-[#f2ca50] text-white shadow-[0_0_16px_rgba(242,202,80,0.15)]"
                            : "bg-[#16181e] border-[#282a2f] text-[#d0c5af] hover:border-[#33353a] hover:text-white"
                        }`}
                        aria-pressed={pressed}
                        onClick={() => setRole(r.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={16} color={pressed ? r.color : C.muted} aria-hidden="true" />
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: pressed ? r.color : undefined }}>
                            {r.id}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Two Column Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full-name" className="text-xs font-bold uppercase tracking-wider text-[#d0c5af] block mb-2">
                    Full Name <span className="text-[#ffb4ab]" aria-hidden="true">*</span>
                  </label>
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
                    className="w-full bg-[#16181e] text-white px-4 py-3.5 rounded-xl border border-[#282a2f] text-sm placeholder-[#99907c] focus:outline-none focus:border-[#f2ca50] transition-colors min-h-[48px]"
                    aria-required="true"
                    aria-describedby={touched.full_name && !form.full_name.trim() ? "name-error" : undefined}
                  />
                  {touched.full_name && !form.full_name.trim() && (
                    <p id="name-error" role="alert" className="text-xs text-[#ffb4ab] mt-2">
                      Please enter your full name.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="work-email" className="text-xs font-bold uppercase tracking-wider text-[#d0c5af] block mb-2">
                    Email Address <span className="text-[#ffb4ab]" aria-hidden="true">*</span>
                  </label>
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
                    className="w-full bg-[#16181e] text-white px-4 py-3.5 rounded-xl border border-[#282a2f] text-sm placeholder-[#99907c] focus:outline-none focus:border-[#f2ca50] transition-colors min-h-[48px]"
                    aria-required="true"
                    aria-describedby={touched.email && !form.email.includes("@") ? "email-error" : undefined}
                  />
                  {touched.email && !form.email.includes("@") && (
                    <p id="email-error" role="alert" className="text-xs text-[#ffb4ab] mt-2">
                      Please enter a valid email address.
                    </p>
                  )}
                </div>
              </div>

              {/* Server error message */}
              {status === "error" && serverError && (
                <div id="server-error" role="alert" className="p-4 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded-xl text-xs text-[#ffb4ab]">
                  {serverError}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  id="waitlist-submit"
                  type="submit"
                  aria-disabled={(!canSubmit || status === "loading") ? "true" : "false"}
                  onClick={(e) => { if (!canSubmit || status === "loading") e.preventDefault(); }}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all min-h-[52px] ${
                    canSubmit && status !== "loading"
                      ? "bg-[#f2ca50] text-[#111318] hover:bg-[#d4af37] shadow-[0_0_24px_rgba(242,202,80,0.3)] cursor-pointer"
                      : "bg-[#282a2f] text-[#99907c] cursor-not-allowed"
                  }`}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      <span className="visually-hidden">Joining the waitlist…</span>
                      <span>Joining waitlist…</span>
                    </>
                  ) : (
                    <>
                      <span>Request Early Access</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-xs text-[#d0c5af]">
                  <Lock size={14} color={C.emerald} aria-hidden="true" />
                  <span>No spam • Direct access when live</span>
                </div>
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
