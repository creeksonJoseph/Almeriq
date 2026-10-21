import React from "react";
import MetricBadge from "./MetricBadge";

export default function ValidationRubricList({ rubricList }) {
  if (!rubricList?.length) return null;

  return (
    <div className="space-y-12">
      {rubricList.map(({ key, title, data }, sectionIndex) => (
        <section key={key} className="border-b border-white/10 pb-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="font-display text-base sm:text-lg font-semibold text-white">
              {sectionIndex + 1}. {title}
            </h3>
            <MetricBadge rating={data.rating} />
          </div>

          {data.assessment && (
            <p className="text-xs sm:text-sm leading-relaxed text-white/80 mb-5">
              {data.assessment}
            </p>
          )}

          {/* 1. Problem & Solution Specifics */}
          {key === "problem_and_solution" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
              {data.problem_clarity && (
                <div>
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
                    Problem Urgency
                  </span>
                  <p className="text-white/75 leading-relaxed">{data.problem_clarity}</p>
                </div>
              )}
              {data.solution_fit && (
                <div>
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
                    Solution Fit
                  </span>
                  <p className="text-white/75 leading-relaxed">{data.solution_fit}</p>
                </div>
              )}
            </div>
          )}

          {/* 2. Market Sizing (Clean Minimalist 3-column metric strip) */}
          {key === "market_size" && (
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                    TAM (Total Addressable)
                  </span>
                  <div className="font-display text-xl sm:text-2xl font-bold text-white mt-1 mb-1">
                    {data.tam?.value || "N/A"}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {data.tam?.description}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                    SAM (Serviceable Available)
                  </span>
                  <div className="font-display text-xl sm:text-2xl font-bold text-white mt-1 mb-1">
                    {data.sam?.value || "N/A"}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {data.sam?.description}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                    SOM (Serviceable Obtainable)
                  </span>
                  <div className="font-display text-xl sm:text-2xl font-bold text-white mt-1 mb-1">
                    {data.som?.value || "N/A"}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {data.som?.description}
                  </p>
                </div>
              </div>

              {data.sizing_rationale && (
                <p className="text-xs text-white/65 leading-relaxed border-t border-white/5 pt-3">
                  <strong className="text-white/80">Methodology: </strong>
                  {data.sizing_rationale}
                </p>
              )}
            </div>
          )}

          {/* 3. Demand Signals & Experiments */}
          {key === "demand" && (
            <div className="space-y-4 mb-4 text-xs">
              <div className="flex flex-wrap items-center gap-4 text-white/70">
                {data.urgency_level && (
                  <div>
                    <span className="text-white/40">Need Urgency: </span>
                    <span className="font-medium text-white">{data.urgency_level}</span>
                  </div>
                )}
                {data.willingness_to_pay && (
                  <div>
                    <span className="text-white/40">Willingness to Pay: </span>
                    <span className="font-medium text-white">{data.willingness_to_pay}</span>
                  </div>
                )}
              </div>

              {data.demand_signals && (
                <p className="text-white/75 leading-relaxed">
                  {data.demand_signals}
                </p>
              )}

              {data.validation_experiments?.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-2">
                    Validation Experiments to Run Before Coding
                  </span>
                  <ol className="space-y-1.5 text-white/75">
                    {data.validation_experiments.map((exp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono text-white/40 shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{exp}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* 4. Competition & Defensibility */}
          {key === "competition" && (
            <div className="space-y-4 mb-4 text-xs">
              {data.landscape_summary && (
                <p className="text-white/75 leading-relaxed">
                  {data.landscape_summary}
                </p>
              )}

              {data.identified_competitors?.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                    Identified Competitors
                  </span>
                  <div className="divide-y divide-white/5 border-t border-b border-white/5">
                    {data.identified_competitors.map((comp, idx) => (
                      <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                        <div className="min-w-0 sm:w-1/3">
                          <span className="font-semibold text-white">{comp.name}</span>
                          <span className="text-[10px] text-white/40 ml-2">({comp.type || "Direct"})</span>
                        </div>
                        <div className="sm:w-2/3 text-white/65 space-y-0.5 text-[11px]">
                          {comp.strengths && <div><span className="text-white/40">Advantage:</span> {comp.strengths}</div>}
                          {comp.differentiation_angle && (
                            <div className="text-white/80"><span className="text-white/40">How We Win:</span> {comp.differentiation_angle}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.moat_assessment && (
                <p className="text-white/75 leading-relaxed pt-1">
                  <strong className="text-white/90">Defensibility Moats: </strong>
                  {data.moat_assessment}
                </p>
              )}
            </div>
          )}

          {/* 5. Feasibilities */}
          {key === "feasibility" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4 text-xs">
              {data.technical && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white">Technical</span>
                    <MetricBadge rating={data.technical.rating} />
                  </div>
                  <p className="text-white/65 leading-relaxed text-[11px]">
                    {data.technical.assessment}
                  </p>
                </div>
              )}

              {data.operational_regulatory && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white">Regulatory & Ops</span>
                    <MetricBadge rating={data.operational_regulatory.rating} />
                  </div>
                  <p className="text-white/65 leading-relaxed text-[11px]">
                    {data.operational_regulatory.assessment}
                  </p>
                </div>
              )}

              {data.economic && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white">Economic & Runway</span>
                    <MetricBadge rating={data.economic.rating} />
                  </div>
                  <p className="text-white/65 leading-relaxed text-[11px]">
                    {data.economic.assessment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 6. Business Model */}
          {key === "business_model" && (
            <div className="space-y-4 mb-4 text-xs">
              {data.revenue_streams?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-2">
                    Revenue Streams
                  </span>
                  <div className="space-y-1.5">
                    {data.revenue_streams.map((rev, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 text-white/75">
                        <span className="font-medium text-white">{rev.stream}:</span>
                        <span>{rev.pricing_model || rev.rationale}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.pricing_strategy && (
                <p className="text-white/75 leading-relaxed">
                  <strong className="text-white/90">Pricing Logic: </strong>
                  {data.pricing_strategy}
                </p>
              )}

              {data.unit_economics && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-2">
                    Unit Economics Outlook
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <div>
                      <span className="text-[10px] text-white/40 block">CAC Outlook</span>
                      <span className="font-medium text-white">{data.unit_economics.cac_outlook || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">LTV Outlook</span>
                      <span className="font-medium text-white">{data.unit_economics.ltv_outlook || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">Margin Potential</span>
                      <span className="font-medium text-[#c9a15a]">{data.unit_economics.margin_potential || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strengths & Recommendations Bullet List */}
          {(data.strengths?.length > 0 || data.recommendations?.length > 0) && (
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {data.strengths?.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 block mb-1">
                    Strengths
                  </span>
                  <ul className="space-y-1 text-white/70">
                    {data.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span className="leading-relaxed">{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.recommendations?.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c9a15a] block mb-1">
                    Action Recommendations
                  </span>
                  <ul className="space-y-1 text-white/70">
                    {data.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#c9a15a]">→</span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
