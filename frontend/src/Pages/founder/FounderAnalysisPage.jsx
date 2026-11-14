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
import FounderFlowLayout from "../../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../../hooks/useFounderFlow";
import { useActiveIdea } from "../../context/IdeaContext";
import { useToast } from "../../context/ToastContext";
import { executeAiToolApi } from "../../lib/api";
import ResultRenderer from "../../components/founder/analysis/ResultRenderer";

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
  const { activeVenture, activeVentureId } = useActiveIdea();

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

  const currentBrief = form && form.idea && form.idea.length >= 10 ? form : activeVenture || form;
  const effectiveVentureId = ventureId || activeVentureId || activeVenture?.id;
  const hasForm = Boolean(currentBrief && currentBrief.idea && currentBrief.idea.length >= 10);

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
        idea: currentBrief.idea,
        problem: currentBrief.problem,
        solution: currentBrief.solution,
        customer: currentBrief.customer,
        location: currentBrief.location,
        // Pass venture_id so the backend can link and update venture analysis
        ...(effectiveVentureId ? { venture_id: effectiveVentureId } : {}),
        ...(forceRefresh ? { extra_params: { refresh: true } } : {}),
      };
      const data = await executeAiToolApi(payload);
      setResult(data.result);
      setStage("result");
    } catch (err) {
      showToast(err.message || "Analysis failed. Please try again.", "error");
      setStage("preview");
    }
  }, [selected, currentBrief, hasForm, effectiveVentureId, showToast]);

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
          <p className="mt-2 text-sm text-white leading-relaxed">
            Share your startup idea first so we can generate your report and advice.
          </p>
          <Link to="/founder/intake?mode=new" className="alq-submit mt-6 sm:mx-auto sm:w-auto sm:px-8 inline-flex">
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
          <p className="mt-3 text-sm leading-relaxed text-white">
            Select an area to evaluate for this project.
          </p>
        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          {ANALYSIS_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => handleSelect(type)}
                className="group flex flex-col justify-start py-2 text-left transition-all"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2ca50]/10 text-[#f2ca50]">
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-[#f2ca50] transition-colors">
                    {type.label}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/70">
                    {type.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            to="/founder/intake?mode=edit"
            className="text-xs text-white/40 hover:text-[#f2ca50] transition-colors"
          >
            Edit project brief →
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
          className="mb-8 flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="max-w-3xl">
          <div className="mb-10 pb-8 border-b border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Overview</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {selected.plan.title}
            </h1>
            <p className="mt-4 text-base text-white/80 leading-relaxed max-w-2xl">{selected.plan.description}</p>
          </div>

          <div className="mb-10 pb-8 border-b border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f2ca50] mb-5">This report will cover:</p>
            <ul className="space-y-4">
              {selected.plan.covers.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white">
                  <div className={`h-2 w-2 rounded-full shrink-0 bg-[#f2ca50]/50`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Startup idea preview */}
          <div className="mb-10 pb-8 border-b border-white/10">
            <div className="flex justify-between items-center mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f2ca50]">Your startup idea</p>
              <Link to="/founder/intake?mode=edit" className="text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Edit</Link>
            </div>
            <div className="space-y-4">
              {[
                ["Idea", form.idea],
                ["Problem", form.problem],
                ["Customer", form.customer],
                ["Location", form.location],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[100px_1fr] gap-4 text-sm">
                  <span className="text-white/40 font-semibold pt-0.5">{label}</span>
                  <span className="text-white leading-relaxed">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
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
          <p className="text-sm text-white max-w-xs leading-relaxed">
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
                className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
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
                <p className="text-xs text-white mt-0.5">Based on your startup idea</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRunAgain}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw size={13} /> Regenerate
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#f2ca50]/25 bg-[#f2ca50]/10 px-3 py-2 text-xs font-semibold text-[#f2ca50] hover:bg-[#f2ca50]/20 transition-all cursor-pointer"
            >
              Run another analysis
            </button>
          </div>
        </div>

        {/* Result */}
        <ResultRenderer analysisKey={selected.key} result={result} />
      </FounderFlowLayout>
    );
  }

  return null;
}
