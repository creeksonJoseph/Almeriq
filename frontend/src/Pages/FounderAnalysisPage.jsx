/**
 * FounderAnalysisPage.jsx
 * Analysis hub: shows 4 analysis type cards, a preview/plan panel on selection,
 * then runs the AI and renders the rich structured result.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  CheckSquare,
  FileText,
  Map,
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  X,
} from "lucide-react";
import FounderFlowLayout from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";
import { useToast } from "../context/ToastContext";
import { executeAiToolApi } from "../lib/api";
import ResultRenderer from "../components/founder/analysis/ResultRenderer";

// ── Analysis type definitions ────────────────────────────────────────────────

const ANALYSIS_TYPES = [
  {
    key: "market_analysis",
    label: "Market Analysis",
    tagline: "Understand customer demand and competitors",
    icon: BarChart3,
    color: "gold",
    gradient: "from-[#f2ca50]/10 to-transparent",
    border: "border-white/10 hover:border-[#f2ca50]/40",
    iconColor: "text-[#f2ca50]",
    badgeColor: "bg-[#f2ca50]/10 text-[#f2ca50] border border-[#f2ca50]/20",
    plan: {
      title: "Market & Audience Plan",
      description:
        "Find out who your real customers are, how big the opportunity is, and who you are competing with.",
      covers: [
        "Audience size & target customer groups",
        "Who your main competitors are",
        "Your unique advantages",
        "Best ways to reach your first users",
        "Emerging industry trends",
        "Overall market verdict",
      ],
    },
  },
  {
    key: "feasibility_analysis",
    label: "Feasibility Check",
    tagline: "Check build difficulty, costs, and time",
    icon: CheckSquare,
    color: "gold",
    gradient: "from-[#f2ca50]/10 to-transparent",
    border: "border-white/10 hover:border-[#f2ca50]/40",
    iconColor: "text-[#f2ca50]",
    badgeColor: "bg-[#f2ca50]/10 text-[#f2ca50] border border-[#f2ca50]/20",
    plan: {
      title: "Feasibility Check",
      description:
        "A straightforward check across 5 areas to see whether your startup idea can realistically be built and run smoothly.",
      covers: [
        "Tech feasibility score & complexity",
        "Recommended tools & tech to use",
        "Cost estimates to build the first version",
        "Time needed to get an MVP live",
        "Rules, safety & legal check",
        "Helpful tips or pivot suggestions",
      ],
    },
  },
  {
    key: "business_plan",
    label: "Business Plan",
    tagline: "How the idea works, how to make money, and growth steps",
    icon: FileText,
    color: "gold",
    gradient: "from-[#f2ca50]/10 to-transparent",
    border: "border-white/10 hover:border-[#f2ca50]/40",
    iconColor: "text-[#f2ca50]",
    badgeColor: "bg-[#f2ca50]/10 text-[#f2ca50] border border-[#f2ca50]/20",
    plan: {
      title: "Business Plan & Revenue",
      description:
        "A clear, practical business plan you can use to explain your idea to teammates, advisors, or investors.",
      covers: [
        "One-sentence pitch & problem solved",
        "How the product works & core features",
        "How you make money (pricing ideas)",
        "How to find your first 100 users",
        "Simple team roles needed",
        "3-year money and growth estimates",
      ],
    },
  },
  {
    key: "execution_roadmap",
    label: "Execution Roadmap",
    tagline: "Weekly steps, first features to build, and key goals",
    icon: Map,
    color: "gold",
    gradient: "from-[#f2ca50]/10 to-transparent",
    border: "border-white/10 hover:border-[#f2ca50]/40",
    iconColor: "text-[#f2ca50]",
    badgeColor: "bg-[#f2ca50]/10 text-[#f2ca50] border border-[#f2ca50]/20",
    plan: {
      title: "Step-by-Step Action Plan",
      description:
        "A clear plan broken into 4 simple phases, with what to do this week, MVP features, and milestones to hit.",
      covers: [
        "Phase 1 (Day 1-30): Idea validation & setup",
        "Phase 2 (Day 30-90): Building the first version",
        "Phase 3 (Day 90-180): Launch & first users",
        "Phase 4 (Day 180-365): Growing & improving",
        "Immediate tasks to start this week",
      ],
    },
  },
];

// ── Main page component ───────────────────────────────────────────────────────

export default function FounderAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, ventureId, resetFlow } = useFounderFlow();

  // Support auto-selecting a tool when navigated from Saved Ideas
  const autoSelectKey = location.state?.autoSelectTool || null;
  const autoRun = Boolean(location.state?.autoRun);

  // If we arrived with an autoSelectTool, find that type
  const autoType = autoSelectKey ? ANALYSIS_TYPES.find((t) => t.key === autoSelectKey) : null;

  const [selected, setSelected] = useState(() => autoType || null);
  const [stage, setStage] = useState(() => {
    if (autoType && autoRun) return "generating";
    if (autoType) return "preview";
    return "hub";
  });
  const { showToast } = useToast();
  const [result, setResult] = useState(null);

  const hasForm = form && form.idea && form.idea.length >= 10;

  const handleSelect = (type) => {
    setSelected(type);
    setResult(null);
    setStage("preview");
  };

  const handleBack = () => {
    if (stage === "preview" || stage === "result") {
      setStage("hub");
      setSelected(null);
      setResult(null);
    }
  };

  const runAnalysis = useCallback(async (toolType, forceRefresh = false) => {
    const targetTool = toolType || selected;
    if (!targetTool || !hasForm) return;
    setSelected(targetTool);
    setStage("generating");
    try {
      const payload = {
        tool_key: targetTool.key,
        idea: form.idea,
        problem: form.problem,
        solution: form.solution,
        customer: form.customer,
        location: form.location,
        // Pass venture_id so the backend can link and update venture analysis
        ...(ventureId ? { venture_id: ventureId } : {}),
        ...(forceRefresh ? { extra_params: { refresh: true } } : {}),
      };
      const data = await executeAiToolApi(payload);
      setResult(data.result);
      setStage("result");
    } catch (err) {
      showToast(err.message || "Analysis failed. Please try again.", "error");
      setStage("preview");
    }
  }, [selected, form, hasForm, ventureId, showToast]);

  // If navigated from Saved Ideas with autoRun requested, immediately fetch from cache or run
  const autoRunExecuted = useRef(false);
  useEffect(() => {
    if (autoType && autoRun && hasForm && !autoRunExecuted.current) {
      autoRunExecuted.current = true;
      runAnalysis(autoType);
    }
  }, [autoType, autoRun, hasForm, runAnalysis]);

  const handleGenerate = () => {
    runAnalysis(selected);
  };

  const handleRunAgain = () => {
    runAnalysis(selected, true);
  };

  // ── No idea saved yet ─────────────────────────────────────────────────────
  if (!hasForm) {
    return (
      <FounderFlowLayout>
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-white">Your analysis is waiting</h1>
          <p className="mt-2 text-sm text-white/50">
            Share your startup idea first so we can generate your report and advice.
          </p>
          <Link to="/founder/intake" className="alq-submit mt-6 sm:mx-auto sm:w-auto sm:px-8 inline-flex">
            Share your idea
          </Link>
        </div>
      </FounderFlowLayout>
    );
  }

  // ── Hub ────────────────────────────────────────────────────────────────────
  if (stage === "hub") {
    return (
      <FounderFlowLayout>
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Analysis & Strategy Modules</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            What do you want to explore?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Select an area to evaluate for this project.
          </p>
        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ANALYSIS_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => handleSelect(type)}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-left hover:border-[#f2ca50]/50 hover:bg-[#f2ca50]/5 transition-all group"
            >
              <div className="font-semibold text-sm text-white group-hover:text-[#f2ca50] transition-colors">
                {type.label}
              </div>
              <p className="mt-1 text-xs text-white/45 leading-relaxed line-clamp-2">
                {type.tagline}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-white/8 pt-6">
          <Link to="/founder/ventures" className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft size={14} /> Back to Saved Ideas
          </Link>
          <Link
            to="/founder/intake"
            className="text-xs text-white/40 hover:text-[#f2ca50] transition-colors"
          >
            Edit project brief
          </Link>
        </div>
      </FounderFlowLayout>
    );
  }

  // ── Preview panel ──────────────────────────────────────────────────────────
  if (stage === "preview" && selected) {
    const Icon = selected.icon;
    return (
      <FounderFlowLayout>
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to overview
        </button>

        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Overview</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {selected.plan.title}
          </h1>
        </div>

        <div className={`rounded-2xl border bg-gradient-to-br ${selected.gradient} ${selected.border} p-6 sm:p-8 mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`rounded-xl p-2.5 bg-white/8 ${selected.iconColor}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-base font-semibold text-white">{selected.label}</p>
              <p className="text-xs text-white/50">Structured strategic review</p>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed mb-6">{selected.plan.description}</p>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">This report will cover:</p>
            <ul className="space-y-2">
              {selected.plan.covers.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${selected.iconColor}`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Startup idea preview */}
        <div className="rounded-2xl border border-white/8 bg-[#141417] p-5 mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">Your startup idea</p>
          <div className="space-y-2">
            {[
              ["Idea", form.idea],
              ["Problem", form.problem],
              ["Customer", form.customer],
              ["Location", form.location],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3 text-xs">
                <span className="w-16 shrink-0 text-white/35 font-semibold">{label}</span>
                <span className="text-white/65 leading-relaxed line-clamp-2">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-white/50 hover:text-white transition-colors px-2 py-2"
          >
            Back to guides
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="alq-submit"
          >
            Run analysis
          </button>
        </div>
      </FounderFlowLayout>
    );
  }

  // ── Generating state ───────────────────────────────────────────────────────
  if (stage === "generating" && selected) {
    const Icon = selected.icon;
    return (
      <FounderFlowLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className={`rounded-2xl p-5 bg-gradient-to-br ${selected.gradient} border ${selected.border} mb-6`}>
            <Icon size={32} className={selected.iconColor} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Loader2 size={18} className="text-[#f2ca50] animate-spin" />
            <p className="text-base font-semibold text-white">Analyzing your {selected.label}...</p>
          </div>
          <p className="text-sm text-white/45 max-w-xs leading-relaxed">
            Analyzing your startup idea. Please wait a moment while we assemble your report.
          </p>
          <div className="mt-6 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#f2ca50]/60 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </FounderFlowLayout>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (stage === "result" && selected && result) {
    const Icon = selected.icon;
    return (
      <FounderFlowLayout>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> All Modules
              </button>
              <span className="text-white/20">/</span>
              <span className="text-xs text-white/60">{selected.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 bg-white/8 ${selected.iconColor}`}>
                <Icon size={18} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold text-white">{selected.label}</h1>
                <p className="text-xs text-white/45 mt-0.5">Based on your startup idea</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRunAgain}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-all"
            >
              <RefreshCw size={13} /> Regenerate
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#f2ca50]/25 bg-[#f2ca50]/10 px-3 py-2 text-xs font-semibold text-[#f2ca50] hover:bg-[#f2ca50]/20 transition-all"
            >
              Run another analysis
            </button>
          </div>
        </div>

        {/* Result */}
        <ResultRenderer analysisKey={selected.key} result={result} />

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-white/8 pt-6">
          <Link to="/founder/ventures" className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft size={14} /> Back to Saved Ideas
          </Link>
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-semibold text-[#f2ca50] hover:text-white transition-colors"
          >
            ← Back to all modules
          </button>
        </div>
      </FounderFlowLayout>
    );
  }

  return null;
}
