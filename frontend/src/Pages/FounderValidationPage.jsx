import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Save,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  Lightbulb,
  Loader2,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { getValidationApi, updateValidationApi } from "../lib/api";
import { useToast } from "../context/ToastContext";

const DIMENSIONS = [
  {
    key: "dim_problem",
    title: "1. Urgent & Painful Problem",
    subtitle: "Customers are actively losing time, money, or opportunity without a solution.",
    tip: "Validate via 10 customer interviews where 8+ confirm this pain is in their top 3 daily bottlenecks.",
    category: "Customer Discovery",
  },
  {
    key: "dim_solution",
    title: "2. Focused Minimal Solution",
    subtitle: "Solves the core pain point in a simple, measurable workflow without bloated scope.",
    tip: "Can you describe the core user outcome in one sentence and test it with a manual concierge prototype?",
    category: "Product Scope",
  },
  {
    key: "dim_demand",
    title: "3. Verified Willingness to Pay",
    subtitle: "Prospective customers have signed Letters of Intent, joined paid pilots, or placed pre-orders.",
    tip: "Do not accept 'Sounds great!' as validation. Ask for an LOI, deposit, or scheduled pilot start date.",
    category: "Commercial Signal",
  },
  {
    key: "dim_market_size",
    title: "4. Sizable or Fast-Growing Market",
    subtitle: "A credible bottom-up path to $10M+ annual revenue exists in your beachhead and expansion sectors.",
    tip: "Calculate bottom-up: (Number of accessible target customers) × (Annual pricing).",
    category: "Market Opportunity",
  },
  {
    key: "dim_competition",
    title: "5. Defensible Differentiation (Moat)",
    subtitle: "Clear unfair advantage over legacy incumbents and potential fast-followers.",
    tip: "Moats include proprietary distribution networks, localized regulatory data, speed, or network effects.",
    category: "Strategy",
  },
  {
    key: "dim_feasibility",
    title: "6. Technical & Operational Feasibility",
    subtitle: "The product can be reliably built, maintained, and delivered with currently available talent and tools.",
    tip: "Identify third-party API dependencies, hardware lead times, and regulatory licenses early.",
    category: "Execution",
  },
  {
    key: "dim_business_model",
    title: "7. Viable Unit Economics",
    subtitle: "Estimated Lifetime Value (LTV) exceeds Customer Acquisition Cost (CAC) by 3x or more.",
    tip: "Ensure your gross margin can absorb payment fees, server compute, and customer support costs.",
    category: "Economics",
  },
  {
    key: "dim_legal",
    title: "8. Regulatory & Compliance Clearance",
    subtitle: "Data privacy, licensing, taxes, and IP protection have no prohibitive legal barriers.",
    tip: "Check data protection laws in your operating countries (e.g., GDPR, local Data Protection Acts).",
    category: "Governance",
  },
  {
    key: "dim_risk",
    title: "9. Downside Risk Mitigation",
    subtitle: "Major operational, supplier, and capital risks have been mapped with concrete contingency plans.",
    tip: "Ask: 'If our key acquisition channel shut down tomorrow, how would we survive?'",
    category: "Resilience",
  },
];

export default function FounderValidationPage() {
  const { showToast } = useToast();
  const [dims, setDims] = useState({
    dim_problem: false,
    dim_solution: false,
    dim_market_size: false,
    dim_demand: false,
    dim_competition: false,
    dim_feasibility: false,
    dim_business_model: false,
    dim_legal: false,
    dim_risk: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    async function fetchValidation() {
      try {
        const data = await getValidationApi();
        if (data) {
          setDims({
            dim_problem: Boolean(data.dim_problem),
            dim_solution: Boolean(data.dim_solution),
            dim_market_size: Boolean(data.dim_market_size),
            dim_demand: Boolean(data.dim_demand),
            dim_competition: Boolean(data.dim_competition),
            dim_feasibility: Boolean(data.dim_feasibility),
            dim_business_model: Boolean(data.dim_business_model),
            dim_legal: Boolean(data.dim_legal),
            dim_risk: Boolean(data.dim_risk),
          });
          if (data.updated_at) {
            setLastSaved(new Date(data.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (err) {
        // use default state
      } finally {
        setLoading(false);
      }
    }
    fetchValidation();
  }, []);

  const currentScore = Object.values(dims).filter(Boolean).length;

  const toggleDim = (key) => {
    setDims((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateValidationApi(dims);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast("Validation rubric successfully saved to your venture record", "success");
    } catch (err) {
      showToast(err.message || "Failed to save validation rubric", "error");
    } finally {
      setSaving(false);
    }
  };

  let readinessLevel = {
    label: "Early Concept Hypothesis",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    summary: "Your idea has initial shape. Focus immediately on customer discovery and confirming commercial demand before building complex features.",
  };

  if (currentScore >= 7) {
    readinessLevel = {
      label: "Institutional & Scale Ready",
      color: "text-[#52b788]",
      bg: "bg-[#52b788]/15 border-[#52b788]/30",
      summary: "Exceptional validation foundation. You have strong market signals, de-risked operations, and are well-positioned for pilot launch and capital raising.",
    };
  } else if (currentScore >= 4) {
    readinessLevel = {
      label: "Promising Commercial Signal",
      color: "text-[#C9A15A]",
      bg: "bg-[#C9A15A]/15 border-[#C9A15A]/30",
      summary: "Good momentum. Solidify your unit economics, legal structure, and competitor moats to move toward full pilot deployment.",
    };
  }

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Idea Validation Rubric"
          subtitle="De-risk your venture across 9 proven startup dimensions before committing capital and engineering."
          action={
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{saving ? "Saving..." : "Save Rubric"}</span>
            </button>
          }
        />

        {/* Scorecard Hero */}
        <div className="mb-8 rounded-2xl border border-[#2B2B31] bg-[#141417] p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#C9A15A]/40 bg-[#1C1C21] shadow-inner">
                <span className="font-display text-4xl font-bold text-[#F3F1EC]">
                  {currentScore}
                </span>
                <span className="text-sm font-semibold text-[#5F5E5A]">/9</span>
              </div>
              <div>
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${readinessLevel.bg} ${readinessLevel.color}`}>
                  {readinessLevel.label}
                </span>
                <p className="mt-2 text-xs leading-relaxed text-[#9B9A94] max-w-xl">
                  {readinessLevel.summary}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0 md:text-right">
              <div className="text-xs text-[#5F5E5A]">
                {lastSaved ? `Last saved at ${lastSaved}` : "Unsaved changes"}
              </div>
              <div className="w-full md:w-48 h-2 rounded-full bg-[#1C1C21] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A15A] to-[#52b788] transition-all duration-300"
                  style={{ width: `${(currentScore / 9) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 9 Dimensions Checklist */}
        <div className="space-y-4">
          {DIMENSIONS.map((dim) => {
            const isChecked = Boolean(dims[dim.key]);
            return (
              <div
                key={dim.key}
                onClick={() => toggleDim(dim.key)}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  isChecked
                    ? "border-[#52b788]/40 bg-[#141417] shadow-sm"
                    : "border-[#2B2B31] bg-[#141417]/60 hover:border-white/20 hover:bg-[#141417]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    aria-label={`Toggle ${dim.title}`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                      isChecked
                        ? "border-[#52b788] bg-[#52b788] text-[#0A0A0B]"
                        : "border-[#5F5E5A] bg-[#1C1C21] text-transparent hover:border-white/50"
                    }`}
                  >
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                  </button>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4
                        className={`text-sm font-semibold transition-colors ${
                          isChecked ? "text-[#F3F1EC]" : "text-[#9B9A94]"
                        }`}
                      >
                        {dim.title}
                      </h4>
                      <span className="rounded bg-[#1C1C21] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#5F5E5A]">
                        {dim.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#9B9A94]">
                      {dim.subtitle}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-[#2B2B31] bg-[#0A0A0B]/50 px-3 py-1.5 text-[11px] text-[#C9A15A]">
                      <Lightbulb size={13} className="shrink-0" />
                      <span>{dim.tip}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FounderFlowGuard>
  );
}
