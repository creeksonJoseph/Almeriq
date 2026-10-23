import React from "react";
import {
  StatStrip,
  EditorialSection,
  ExecutiveBanner,
} from "../../ui/BorderlessPrimitives";
import { TagList } from "./AnalysisSharedComponents";

export default function BusinessPlanResult({ result }) {
  const financialMetrics = result.financial_projections
    ? [
        { label: "Year 1 Revenue", value: result.financial_projections.year1_revenue_estimate || "-", subtext: "Initial launch phase" },
        { label: "Year 2 Revenue", value: result.financial_projections.year2_revenue_estimate || "-", subtext: "Growth phase" },
        { label: "Year 3 Revenue", value: result.financial_projections.year3_revenue_estimate || "-", subtext: "Scale phase", valueColor: "text-[#f2ca50]" },
      ]
    : [];

  const unitEconItems = result.business_model?.unit_economics
    ? [
        { label: "Estimated CAC", value: result.business_model.unit_economics.cac_estimate || "-", subtext: "Cost to acquire 1 customer" },
        { label: "Estimated LTV", value: result.business_model.unit_economics.ltv_estimate || "-", subtext: "Lifetime revenue per customer", valueColor: "text-[#f2ca50]" },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Executive Summary Banner */}
      <ExecutiveBanner
        kicker="Business Architecture Plan"
        verdict="Strategic Blueprint"
        rationale={result.executive_summary}
        tone="gold"
      />

      {/* Value Proposition Callout */}
      {result.value_proposition && (
        <div className="border-l-2 border-[#f2ca50] pl-4 py-2 bg-gradient-to-r from-[#f2ca50]/5 to-transparent">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">Core Value Proposition</span>
          <p className="font-display text-base sm:text-lg text-white font-medium mt-1 italic">
            "{result.value_proposition}"
          </p>
        </div>
      )}

      {/* Problem & Solution Flow */}
      <div className="grid gap-8 lg:grid-cols-2">
        <EditorialSection title="Problem Being Solved">
          <p className="text-sm leading-relaxed text-white">{result.problem_statement}</p>
        </EditorialSection>
        <EditorialSection title="The Solution">
          <p className="text-sm leading-relaxed text-white">{result.solution_description}</p>
        </EditorialSection>
      </div>

      {/* Business Model & Revenue Streams */}
      {result.business_model && (
        <EditorialSection title="Business Model & Revenue Streams">
          {result.business_model.revenue_streams?.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5 mb-6">
              {result.business_model.revenue_streams.map((rs, i) => (
                <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{rs.stream}</h4>
                    <p className="text-xs text-white mt-0.5">{rs.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.business_model.pricing_strategy && (
            <div className="mb-6 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Pricing Strategy</span>
              <p className="text-xs sm:text-sm text-white">{result.business_model.pricing_strategy}</p>
            </div>
          )}

          {unitEconItems.length > 0 && <StatStrip items={unitEconItems} />}
        </EditorialSection>
      )}

      {/* Financial Projections Strip */}
      {financialMetrics.length > 0 && (
        <EditorialSection title="3-Year Financial Estimates">
          <StatStrip items={financialMetrics} />
          {result.financial_projections && (
            <div className="flex flex-wrap items-center gap-6 mt-4 text-xs text-white">
              <span>Break-even Target: <strong className="text-white font-medium">{result.financial_projections.break_even_timeline}</strong></span>
              <span>Capital Required: <strong className="text-[#f2ca50] font-medium">{result.financial_projections.funding_required}</strong></span>
            </div>
          )}
        </EditorialSection>
      )}

      {/* Marketing Strategy */}
      {result.marketing_strategy && (
        <EditorialSection title="Go-to-Market & Acquisition">
          <p className="text-sm text-white mb-4">{result.marketing_strategy.positioning}</p>
          <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-xl border border-white/8 bg-white/[0.02] text-xs">
            <div>
              <span className="font-semibold text-white/90 block mb-1">Acquisition Loop</span>
              <p className="text-white leading-relaxed">{result.marketing_strategy.acquisition_strategy}</p>
            </div>
            <div>
              <span className="font-semibold text-white/90 block mb-1">Retention Strategy</span>
              <p className="text-white leading-relaxed">{result.marketing_strategy.retention_strategy}</p>
            </div>
          </div>
          {result.marketing_strategy.channels?.length > 0 && (
            <div className="mt-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-2">Recommended Channels</span>
              <TagList items={result.marketing_strategy.channels} />
            </div>
          )}
        </EditorialSection>
      )}

      {/* Milestones & Risk Mitigation */}
      <div className="grid gap-8 lg:grid-cols-2 pt-2 border-t border-white/8">
        {result.milestones?.length > 0 && (
          <EditorialSection title="Key Execution Milestones">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
              {result.milestones.map((m, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-white">{m.milestone}</p>
                    <p className="text-white mt-0.5">{m.success_metric}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full">
                    {m.target_date}
                  </span>
                </div>
              ))}
            </div>
          </EditorialSection>
        )}

        {result.risk_mitigation?.length > 0 && (
          <EditorialSection title="Risk Mitigation Tactics">
            <div className="space-y-3">
              {result.risk_mitigation.map((r, i) => (
                <div key={i} className="border-l-2 border-rose-500/40 pl-3 py-1">
                  <p className="text-xs font-semibold text-rose-300">{r.risk}</p>
                  <p className="text-xs text-white mt-0.5">{r.mitigation}</p>
                </div>
              ))}
            </div>
          </EditorialSection>
        )}
      </div>
    </div>
  );
}
