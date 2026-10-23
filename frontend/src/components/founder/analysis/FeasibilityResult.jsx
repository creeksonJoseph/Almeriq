import React from "react";
import {
  StatStrip,
  EditorialSection,
  ExecutiveBanner,
} from "../../ui/BorderlessPrimitives";
import { TagList, NumberedList, ScoreBadge } from "./AnalysisSharedComponents";

export default function FeasibilityResult({ result }) {
  const tone = result.overall_feasibility_verdict?.includes("Highly")
    ? "gold"
    : result.overall_feasibility_verdict?.includes("Low")
    ? "red"
    : "muted";

  const resourceItems = result.resource_requirements
    ? [
        { label: "Capital Estimate", value: result.resource_requirements.capital_estimate || "-", subtext: "Seed/build phase need" },
        { label: "Timeline to MVP", value: result.resource_requirements.timeline_to_mvp || "-", subtext: "From start to first live test", valueColor: "text-[#f2ca50]" },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Executive Feasibility Header */}
      <ExecutiveBanner
        kicker="Feasibility Diagnostic"
        verdict={result.overall_feasibility_verdict}
        rationale={result.executive_summary}
        tone={tone}
        aside={
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Total Score</span>
            <ScoreBadge score={result.overall_feasibility_score} />
          </div>
        }
      />

      {/* Dimension Scores - Streamlined Scoreboard */}
      {result.dimensions?.length > 0 && (
        <EditorialSection title="Feasibility Dimensions & Breakdown" badge="5 Core Pillars">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
            {result.dimensions.map((dim, i) => {
              const scoreTone =
                dim.score >= 8
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : dim.score >= 6
                  ? "text-[#f2ca50] bg-[#f2ca50]/10 border-[#f2ca50]/20"
                  : "text-rose-400 bg-rose-500/10 border-rose-500/20";
              return (
                <div key={i} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-sm font-semibold text-white">{dim.dimension}</span>
                    <span className={`font-mono text-xs font-bold rounded-md border px-2.5 py-0.5 ${scoreTone}`}>
                      {dim.score}/10
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-white leading-relaxed">{dim.assessment}</p>
                  {dim.recommendations?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f2ca50] mb-1.5">Advice:</p>
                      <ul className="space-y-1">
                        {dim.recommendations.map((r, j) => (
                          <li key={j} className="text-xs text-white flex items-start gap-2">
                            <span className="text-[#f2ca50] font-bold">·</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </EditorialSection>
      )}

      {/* Resource Requirements Stat Strip */}
      {resourceItems.length > 0 && (
        <EditorialSection title="Resource Requirements & Estimates">
          <StatStrip items={resourceItems} />
          <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t border-white/8">
            {result.resource_requirements?.team?.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-2">Core Team Roles</span>
                <TagList items={result.resource_requirements.team} />
              </div>
            )}
            {result.resource_requirements?.technology?.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-2">Recommended Stack</span>
                <TagList items={result.resource_requirements.technology} />
              </div>
            )}
          </div>
        </EditorialSection>
      )}

      {/* Success Factors & Risks */}
      <div className="grid gap-8 lg:grid-cols-2 pt-2">
        <EditorialSection title="Critical Success Factors">
          <NumberedList items={result.critical_success_factors} colorClass="text-[#f2ca50]" />
        </EditorialSection>
        <EditorialSection title="Failure Risks to Watch">
          <NumberedList items={result.critical_failure_risks} colorClass="text-rose-400" />
        </EditorialSection>
      </div>

      {/* Pivot Options & Next Steps */}
      <div className="grid gap-8 lg:grid-cols-2 pt-2 border-t border-white/8">
        {result.pivot_options?.length > 0 && (
          <EditorialSection title="Strategic Pivot Options">
            <div className="space-y-3">
              {result.pivot_options.map((p, i) => (
                <div key={i} className="border-l-2 border-white/20 pl-3 py-1">
                  <p className="text-sm font-semibold text-white">{p.pivot}</p>
                  <p className="text-xs text-white mt-0.5">{p.rationale}</p>
                </div>
              ))}
            </div>
          </EditorialSection>
        )}
        <EditorialSection title="Actionable Next Moves">
          <NumberedList items={result.recommended_next_steps} />
        </EditorialSection>
      </div>
    </div>
  );
}
