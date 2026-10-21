import React from "react";
import MetricBadge from "./MetricBadge";

export default function ExecutiveDiagnosis({
  evaluation,
  activeFilter,
  setActiveFilter,
  ratingCounts,
}) {
  if (!evaluation) return null;

  return (
    <section className="pb-8 border-b border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            {evaluation.overall_score || 0}
          </span>
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
            / 100 Score
          </span>
          <MetricBadge rating={evaluation.overall_rating} />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "strong" ? "all" : "strong")}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              activeFilter === "strong"
                ? "bg-emerald-500/20 text-emerald-300 font-medium"
                : "text-emerald-400/80 hover:bg-emerald-500/10"
            }`}
          >
            {ratingCounts.strong} Strong
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "vague" ? "all" : "vague")}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              activeFilter === "vague"
                ? "bg-amber-500/20 text-amber-300 font-medium"
                : "text-amber-400/80 hover:bg-amber-500/10"
            }`}
          >
            {ratingCounts.vague} Vague
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "weak" ? "all" : "weak")}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              activeFilter === "weak"
                ? "bg-rose-500/20 text-rose-300 font-medium"
                : "text-rose-400/80 hover:bg-rose-500/10"
            }`}
          >
            {ratingCounts.weak} Weak
          </button>
        </div>
      </div>

      {evaluation.executive_summary && (
        <p className="text-sm leading-relaxed text-white/80 max-w-5xl">
          {evaluation.executive_summary}
        </p>
      )}

      {/* Strengths & Red Flags 2-column text list */}
      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {evaluation.top_strengths?.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 mb-2">
              Key Strengths
            </h4>
            <ul className="space-y-1.5 text-white/75">
              {evaluation.top_strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400/70 font-semibold">•</span>
                  <span className="leading-relaxed">{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.critical_red_flags?.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-400/90 mb-2">
              Critical Blindspots & Risks
            </h4>
            <ul className="space-y-1.5 text-white/75">
              {evaluation.critical_red_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400/70 font-semibold">•</span>
                  <span className="leading-relaxed">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Immediate Action Plan */}
      {evaluation.immediate_action_plan?.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/5 text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-3">
            Immediate Action Plan
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/80">
            {evaluation.immediate_action_plan.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-mono text-white/40 shrink-0">
                  {idx + 1}.
                </span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
