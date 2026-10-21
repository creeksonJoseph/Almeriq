import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { getValidationApi, updateValidationApi } from "../lib/api";
import { useToast } from "../context/ToastContext";

const DIMENSIONS = [
  {
    key: "dim_problem",
    title: "1. Real Problem (Do people actually care?)",
    subtitle: "People lose time, money, or get frustrated because this problem isn't solved.",
    tip: "Talk to at least 5-10 people experiencing this and see if it's a top headache for them.",
    category: "User Need",
  },
  {
    key: "dim_solution",
    title: "2. Simple Solution (Does it fix it?)",
    subtitle: "Solves the main problem in a simple, clear way without complicated extra stuff.",
    tip: "Can you explain how it works in one sentence and test it simply before coding?",
    category: "Solution",
  },
  {
    key: "dim_demand",
    title: "3. Will People Pay or Use It?",
    subtitle: "People have promised to use it, pre-ordered, or confirmed they want to pay.",
    tip: "Don't just take 'Cool idea!' as proof. Ask: 'Would you pay $5 or sign up today?'",
    category: "Demand",
  },
  {
    key: "dim_market_size",
    title: "4. Good Audience Size",
    subtitle: "There are enough potential users or customers to make building this worthwhile.",
    tip: "Count: about how many people in your school, town, or online community need this?",
    category: "Audience",
  },
  {
    key: "dim_competition",
    title: "5. Why You? (Competitors)",
    subtitle: "You know what other apps or tools exist and why yours will be better or unique.",
    tip: "What makes yours different: is it faster, simpler, cheaper, or built for your community?",
    category: "Uniqueness",
  },
  {
    key: "dim_feasibility",
    title: "6. Can You Actually Build It?",
    subtitle: "The app or project can be built with tools, skills, and resources you have or can learn.",
    tip: "Pick tools and libraries you know or can pick up easily. Keep the first version small.",
    category: "Feasibility",
  },
  {
    key: "dim_business_model",
    title: "7. Money & Costs (Unit Economics)",
    subtitle: "You make more money from each user than it costs you to host or deliver the product.",
    tip: "Think about monthly server costs or payment fees versus what you charge.",
    category: "Money",
  },
  {
    key: "dim_legal",
    title: "8. Safety, Rules & Legal",
    subtitle: "No major rules, copyright issues, or privacy laws are being broken.",
    tip: "Check basic rules: don't copy logos, respect user privacy, and be transparent.",
    category: "Safety",
  },
  {
    key: "dim_risk",
    title: "9. Backup Plan (What if things go wrong?)",
    subtitle: "You have thought about what could break or go wrong, and how to handle it.",
    tip: "Ask yourself: 'If our main tool or social channel stops working, what do we do?'",
    category: "Backup Plan",
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
      showToast("Checklist saved successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to save checklist", "error");
    } finally {
      setSaving(false);
    }
  };

  let readinessLevel = {
    label: "Getting Started",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    summary: "Talk to real people to make sure they actually want this before writing code.",
  };

  if (currentScore >= 7) {
    readinessLevel = {
      label: "Ready to Build!",
      color: "text-[#52b788]",
      bg: "bg-[#52b788]/15 border-[#52b788]/30",
      summary: "Awesome job. You have checked the major boxes and are ready to start building.",
    };
  } else if (currentScore >= 4) {
    readinessLevel = {
      label: "Looking Good!",
      color: "text-[#C9A15A]",
      bg: "bg-[#C9A15A]/15 border-[#C9A15A]/30",
      summary: "Good momentum. Solidify pricing and check competitors as you move forward.",
    };
  }

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Idea Checklist"
          subtitle="Check 9 key steps to see if your idea is ready to build and launch."
          action={
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              <span>{saving ? "Saving..." : "Save Checklist"}</span>
            </button>
          }
        />

        {/* Clean Progress Strip */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-bold text-white">
              {currentScore}<span className="text-xs font-semibold text-white/40">/9</span>
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${readinessLevel.bg} ${readinessLevel.color}`}>
              {readinessLevel.label}
            </span>
            <span className="hidden text-xs text-white/50 sm:inline">
              {readinessLevel.summary}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#C9A15A] to-[#52b788] transition-all duration-300"
                style={{ width: `${(currentScore / 9) * 100}%` }}
              />
            </div>
            {lastSaved && (
              <span className="text-[11px] text-white/40">Saved {lastSaved}</span>
            )}
          </div>
        </div>

        {/* 9 Dimensions Unified Diagnostic Table */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
          {DIMENSIONS.map((dim) => {
            const isChecked = Boolean(dims[dim.key]);
            return (
              <div
                key={dim.key}
                onClick={() => toggleDim(dim.key)}
                className={`group p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-white/[0.02] ${
                  isChecked ? "bg-emerald-500/[0.02]" : ""
                }`}
              >
                <button
                  type="button"
                  aria-label={`Toggle ${dim.title}`}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    isChecked
                      ? "border-emerald-500 bg-emerald-500 text-[#0A0A0B]"
                      : "border-white/20 bg-white/5 text-transparent group-hover:border-white/40"
                  }`}
                >
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4
                      className={`text-sm font-semibold transition-colors ${
                        isChecked ? "text-white" : "text-white/80 group-hover:text-white"
                      }`}
                    >
                      {dim.title}
                    </h4>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                      {dim.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/50 leading-relaxed">
                    {dim.subtitle}
                  </p>
                  <p className="mt-2 text-[11px] leading-snug text-[#f2ca50]/80">
                    <span className="font-semibold text-[#f2ca50]">Guidance:</span> {dim.tip}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FounderFlowGuard>
  );
}
