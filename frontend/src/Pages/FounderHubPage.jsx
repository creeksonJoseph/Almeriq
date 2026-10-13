import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  Lightbulb,
  CheckCircle2,
  Cpu,
  Boxes,
  Scale,
  Send,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  ShieldCheck,
  Building,
  Target,
  BarChart3,
  Layers,
  FileText,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { listVenturesApi, getValidationApi, listLegalFilingsApi } from "../lib/api";

const INDUSTRIES = [
  { id: "fintech", name: "Fintech & Payments", icon: BarChart3, desc: "Banking, lending, remittances, mobile money" },
  { id: "healthtech", name: "Healthcare & Life Sciences", icon: ShieldCheck, desc: "Telemedicine, diagnostics, clinics, supply chain" },
  { id: "agritech", name: "AgriTech & Food Systems", icon: Layers, desc: "Yield optimization, farm logistics, cold chain" },
  { id: "logistics", name: "Supply Chain & Mobility", icon: Target, desc: "Freight, last-mile delivery, fleet telemetry" },
  { id: "energy", name: "Clean Energy & Climate", icon: Zap, desc: "Mini-grids, solar leasing, carbon intelligence" },
  { id: "saas", name: "B2B SaaS & Enterprise", icon: Boxes, desc: "Workflow automation, business OS, compliance" },
  { id: "edtech", name: "EdTech & Upskilling", icon: FileText, desc: "Technical academies, workforce readiness" },
  { id: "infrastructure", name: "Physical Infrastructure", icon: Building, desc: "Heavy assets, telecom, power, hardware" },
];

export default function FounderHubPage() {
  const navigate = useNavigate();
  const [selectedIndustry, setSelectedIndustry] = useState(() => {
    return localStorage.getItem("almeriq_founder_industry") || "fintech";
  });
  const [validationScore, setValidationScore] = useState(0);
  const [venturesCount, setVenturesCount] = useState(0);
  const [latestVenture, setLatestVenture] = useState(null);
  const [filingsCount, setFilingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [val, ventures, filings] = await Promise.allSettled([
          getValidationApi(),
          listVenturesApi(),
          listLegalFilingsApi(),
        ]);
        if (val.status === "fulfilled" && val.value) {
          setValidationScore(val.value.score || 0);
        }
        if (ventures.status === "fulfilled" && Array.isArray(ventures.value)) {
          setVenturesCount(ventures.value.length);
          if (ventures.value.length > 0) {
            setLatestVenture(ventures.value[0]);
          }
        }
        if (filings.status === "fulfilled" && Array.isArray(filings.value)) {
          setFilingsCount(filings.value.length);
        }
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleSelectIndustry = (id) => {
    setSelectedIndustry(id);
    localStorage.setItem("almeriq_founder_industry", id);
  };

  // Determine current founder stage and recommended next move
  let nextMove = {
    title: "Draft your first venture brief",
    desc: "Feed your business idea into Alimeriq's AI engine to extract market signals, risks, and MVP scope.",
    link: "/founder/intake",
    actionText: "Start Venture Brief",
  };

  if (venturesCount === 0) {
    nextMove = {
      title: "Analyze your startup hypothesis",
      desc: "Begin with a 5-field brief to test customer need, market sizing, and an immediate execution roadmap.",
      link: "/founder/intake",
      actionText: "Create Venture Brief",
    };
  } else if (validationScore < 5) {
    nextMove = {
      title: "Complete the 9-point validation rubric",
      desc: `Your idea validation score is currently ${validationScore}/9. De-risk your market, customer willingness to pay, and feasibility before writing code.`,
      link: "/founder/validation",
      actionText: "Open Validation Rubric",
    };
  } else if (filingsCount === 0) {
    nextMove = {
      title: "Protect your IP or start entity registration",
      desc: "Your venture concept is validated. Generate formal entity filing papers or register your copyright with an Alimeriq ref number.",
      link: "/founder/legal",
      actionText: "Prepare Legal Filing",
    };
  } else {
    nextMove = {
      title: "Synthesize full execution collateral",
      desc: "Generate your Pitch Deck, Financial Projections, Sprint Backlog, and Investor Update via the AI Business Builder.",
      link: "/founder/ai-tools",
      actionText: "Launch AI Business Builder",
    };
  }

  const TOOLS = [
    {
      title: "Venture Brief & Analysis",
      desc: "5-field rapid submission with instant Gemini strategic analysis, roadmap, and risk scoring.",
      link: "/founder/intake",
      badge: venturesCount > 0 ? `${venturesCount} saved` : "Ready",
      badgeColor: "text-[#C9A15A] bg-[#C9A15A]/10 border-[#C9A15A]/20",
      icon: Lightbulb,
    },
    {
      title: "Idea Validation Rubric",
      desc: "Score your idea across 9 critical dimensions: problem urgency, unit economics, demand, and barriers.",
      link: "/founder/validation",
      badge: `${validationScore}/9 points`,
      badgeColor: validationScore >= 6 ? "text-[#3E8368] bg-[#3E8368]/15 border-[#3E8368]/30" : "text-[#C9A15A] bg-[#C9A15A]/10 border-[#C9A15A]/20",
      icon: CheckCircle2,
    },
    {
      title: "AI Business Builder",
      desc: "Generate Lean Canvas, SWOT analysis, 10-slide Pitch Deck, 12-month Financial Model, and Risk Matrix.",
      link: "/founder/ai-tools",
      badge: "5 AI Generators",
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      icon: Cpu,
    },
    {
      title: "Product Development",
      desc: "Map user personas, step-by-step customer journeys, recommended production tech stack, and sprint backlog.",
      link: "/founder/product",
      badge: "4 Spec Tools",
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      icon: Boxes,
    },
    {
      title: "Legal & Entity Registration",
      desc: "Submit incorporation and intellectual property registrations with official ALQ tracking reference numbers.",
      link: "/founder/legal",
      badge: filingsCount > 0 ? `${filingsCount} filed` : "Templates ready",
      badgeColor: filingsCount > 0 ? "text-[#3E8368] bg-[#3E8368]/15 border-[#3E8368]/30" : "text-white/40 bg-white/5 border-white/10",
      icon: Scale,
    },
    {
      title: "Outreach & Job Postings",
      desc: "Generate monthly investor update emails with KPIs, highlights, asks, and high-impact founding team job descriptions.",
      link: "/founder/outreach",
      badge: "Ready",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: Send,
    },
  ];

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Founder Studio Command Hub"
          subtitle="All strategic, product, legal, and investor tools to take your venture from concept to scale."
        />

        {/* Hero Next-Move Card */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-[#C9A15A]/40 bg-gradient-to-br from-[#1C1C21] via-[#141417] to-[#0A0A0B] p-6 shadow-xl sm:p-8">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#C9A15A]/10 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A15A]/40 bg-[#C9A15A]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#E8D6A8]">
                  <Sparkles size={13} className="text-[#C9A15A]" /> Recommended Next Move
                </span>
                {latestVenture && (
                  <span className="hidden truncate text-xs text-[#9B9A94] sm:inline">
                    Focus: <strong className="text-white">{latestVenture.idea.slice(0, 35)}...</strong>
                  </span>
                )}
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#F3F1EC] sm:text-3xl">
                {nextMove.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#9B9A94]">
                {nextMove.desc}
              </p>
            </div>
            <Link
              to={nextMove.link}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] px-6 py-3.5 text-xs font-semibold text-[#0A0A0B] shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{nextMove.actionText}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Industry Sector Focus Selector */}
        <div className="mb-10 rounded-2xl border border-[#2B2B31] bg-[#141417] p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#F3F1EC]">
                Industry & Sector Focus
              </h3>
              <p className="text-xs text-[#9B9A94]">
                Calibrates market benchmarks, regulatory alerts, and AI prompts to your vertical.
              </p>
            </div>
            <span className="rounded-md border border-[#2B2B31] bg-[#1C1C21] px-2.5 py-1 text-xs text-[#E8D6A8]">
              Active: {INDUSTRIES.find((i) => i.id === selectedIndustry)?.name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              const isSelected = selectedIndustry === ind.id;
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => handleSelectIndustry(ind.id)}
                  className={`flex flex-col rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-[#C9A15A] bg-[#C9A15A]/10 shadow-sm"
                      : "border-[#2B2B31] bg-[#1C1C21]/60 hover:border-white/20 hover:bg-[#1C1C21]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon
                      size={18}
                      className={isSelected ? "text-[#C9A15A]" : "text-[#9B9A94]"}
                    />
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-[#C9A15A]" />
                    )}
                  </div>
                  <span
                    className={`mt-2.5 text-xs font-semibold ${
                      isSelected ? "text-[#F3F1EC]" : "text-[#9B9A94]"
                    }`}
                  >
                    {ind.name}
                  </span>
                  <span className="mt-1 line-clamp-1 text-[11px] text-[#5F5E5A]">
                    {ind.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[#F3F1EC]">
              Founder Studio Workspaces
            </h3>
            <span className="text-xs text-[#9B9A94]">
              {TOOLS.length} modules available
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="group flex flex-col justify-between rounded-2xl border border-[#2B2B31] bg-[#141417] p-5 transition-all hover:border-[#C9A15A]/40 hover:bg-[#1C1C21]/70"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2B2B31] bg-[#1C1C21] text-[#C9A15A] group-hover:border-[#C9A15A]/30">
                        <Icon size={20} />
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tool.badgeColor}`}
                      >
                        {tool.badge}
                      </span>
                    </div>
                    <h4 className="mt-4 font-display text-base font-semibold text-[#F3F1EC] group-hover:text-[#E8D6A8]">
                      {tool.title}
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#9B9A94]">
                      {tool.desc}
                    </p>
                  </div>
                  <div className="mt-6 border-t border-[#2B2B31]/60 pt-4">
                    <Link
                      to={tool.link}
                      className="inline-flex w-full items-center justify-between text-xs font-semibold text-[#F3F1EC] transition-colors group-hover:text-[#C9A15A]"
                    >
                      <span>Open Module</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FounderFlowGuard>
  );
}
