import React from "react";
import {
  EditorialSection,
  ExecutiveBanner,
  TimelineFlow,
} from "../../ui/BorderlessPrimitives";
import { NumberedList } from "./AnalysisSharedComponents";

export default function ExecutionRoadmapResult({ result }) {
  const timelineSteps = (result.phases || []).map((p, idx) => ({
    phase: `Phase ${idx + 1}`,
    title: p.phase,
    duration: p.duration,
    description: p.objective,
    deliverables: p.deliverables || [],
    active: idx === 0,
  }));

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <ExecutiveBanner
        kicker="Execution Roadmap"
        verdict="Phased Action Timeline"
        rationale={result.summary}
        tone="gold"
      />

      {/* Quick Wins */}
      {result.quick_wins?.length > 0 && (
        <EditorialSection title="Immediate Quick Wins (Start This Week)">
          <NumberedList items={result.quick_wins} colorClass="text-[#f2ca50]" />
        </EditorialSection>
      )}

      {/* TimelineFlow - Connected Vertical Stepper */}
      {timelineSteps.length > 0 && (
        <EditorialSection title="Sequential Implementation Phases" badge={`${timelineSteps.length} Phases`}>
          <TimelineFlow steps={timelineSteps} />
        </EditorialSection>
      )}

      {/* Critical Path & Team Hiring Plan */}
      <div className="grid gap-8 lg:grid-cols-2 pt-2 border-t border-white/8">
        {result.critical_path?.length > 0 && (
          <EditorialSection title="Critical Path Dependencies">
            <NumberedList items={result.critical_path} colorClass="text-[#f2ca50]" />
          </EditorialSection>
        )}

        {result.team_hiring_plan?.length > 0 && (
          <EditorialSection title="Team Hiring Sequence">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
              {result.team_hiring_plan.map((h, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-white">{h.role}</p>
                    <p className="text-white/45 mt-0.5">{h.when_to_hire}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    h.priority === "High" ? "bg-rose-500/15 text-rose-300"
                    : h.priority === "Medium" ? "bg-[#f2ca50]/15 text-[#f2ca50]"
                    : "bg-white/10 text-white/50"
                  }`}>
                    {h.priority}
                  </span>
                </div>
              ))}
            </div>
          </EditorialSection>
        )}
      </div>

      {/* Budget Allocation Progress */}
      {result.budget_allocation?.length > 0 && (
        <EditorialSection title="Budget Allocation Breakdown">
          <div className="space-y-4 max-w-3xl">
            {result.budget_allocation.map((b, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-white/80 font-medium">{b.category}</span>
                  <span className="font-mono font-bold text-[#f2ca50]">{b.percentage}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[#f2ca50]/80 transition-all duration-500" style={{ width: `${b.percentage}%` }} />
                </div>
                {b.notes && <p className="text-[11px] text-white/40 mt-1">{b.notes}</p>}
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* KPIs Table */}
      {result.kpis?.length > 0 && (
        <EditorialSection title="Key Performance Metrics">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-white/40">Metric</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-white/40">Target</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-white/40">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {result.kpis.map((k, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4 text-white font-medium">{k.metric}</td>
                    <td className="py-2.5 px-4 text-[#f2ca50] font-semibold">{k.target}</td>
                    <td className="py-2.5 px-4 text-white/50">{k.measurement_frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EditorialSection>
      )}
    </div>
  );
}
