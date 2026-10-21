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
import {
  StatStrip,
  EditorialSection,
  ExecutiveBanner,
  TimelineFlow,
} from "../components/ui/BorderlessPrimitives";

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

// ── Colour helpers ────────────────────────────────────────────────────────────

const PHASE_COLORS = ["text-[#f2ca50]", "text-white", "text-[#f2ca50]", "text-white"];
const PHASE_BG = [
  "bg-white/[0.03] border-white/10",
  "bg-white/[0.03] border-white/10",
  "bg-white/[0.03] border-white/10",
  "bg-white/[0.03] border-white/10"
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TagList({ items, colorClass = "bg-white/5 text-white/75 border border-white/8" }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`rounded-md px-2.5 py-1 text-xs font-medium ${colorClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function NumberedList({ items, colorClass = "text-[#f2ca50]" }) {
  if (!items?.length) return null;
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-xs sm:text-sm text-white/70 leading-relaxed">
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 bg-white/6 ${colorClass}`}>
            {i + 1}
          </span>
          <span>{typeof item === "object" ? JSON.stringify(item) : item}</span>
        </li>
      ))}
    </ol>
  );
}

function ScoreBadge({ score, max = 10 }) {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? "text-[#f2ca50]" : pct >= 50 ? "text-white" : "text-white/60";
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-3xl sm:text-4xl font-bold tabular-nums font-display ${color}`}>
        {score}
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-white/40">/{max}</span>
    </div>
  );
}

// ── Result renderers per analysis type ───────────────────────────────────────

function MarketAnalysisResult({ result }) {
  const tone = result.verdict?.includes("Strong")
    ? "gold"
    : result.verdict?.includes("Challenging")
    ? "red"
    : "muted";

  const marketSizeItems = result.market_size
    ? [
        { label: "TAM (Total Market)", value: result.market_size.tam, subtext: "Total industry opportunity" },
        { label: "SAM (Serviceable)", value: result.market_size.sam, subtext: "Addressable with core product" },
        { label: "SOM (Obtainable)", value: result.market_size.som, subtext: "Realistic target within 1-2 years", valueColor: "text-[#f2ca50]" },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Executive Verdict Banner */}
      <ExecutiveBanner
        kicker="Market Opportunity Verdict"
        verdict={result.verdict}
        rationale={result.verdict_rationale}
        tone={tone}
      />

      {/* Market Overview */}
      {result.market_overview && (
        <EditorialSection title="Market Overview">
          <p className="text-sm sm:text-base leading-relaxed text-white/80 max-w-4xl">
            {result.market_overview}
          </p>
        </EditorialSection>
      )}

      {/* Market Size Stat Strip */}
      {marketSizeItems.length > 0 && (
        <EditorialSection title="Market Sizing (TAM / SAM / SOM)">
          <StatStrip items={marketSizeItems} />
        </EditorialSection>
      )}

      {/* Target Segments - Clean Data Rows */}
      {result.target_segments?.length > 0 && (
        <EditorialSection title="Target Customer Segments" badge={`${result.target_segments.length} segments identified`}>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
            {result.target_segments.map((s, i) => (
              <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{s.segment}</h4>
                    <span className="rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/20 px-2 py-0.5 text-[10px] font-medium text-[#f2ca50]">
                      Pain Score: {s.pain_level}/10
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Market size estimate: <strong className="text-white/70 font-medium">{s.size_estimate}</strong>
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 block">Willingness to Pay</span>
                  <span className="text-xs font-semibold text-white/85">{s.willingness_to_pay}</span>
                </div>
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Competitive Landscape - Borderless Intelligence Table */}
      {result.competitive_landscape?.length > 0 && (
        <EditorialSection title="Competitive Intelligence Matrix">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-white/40">Competitor</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-white/40">Market Share</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-white/40">Key Strengths</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-white/40">Vulnerabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.competitive_landscape.map((c, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white text-sm whitespace-nowrap">
                        {c.competitor}
                      </td>
                      <td className="py-3.5 px-4 text-white/50 whitespace-nowrap">
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] font-mono">
                          {c.market_share_estimate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <ul className="space-y-1">
                          {c.strengths?.map((s, j) => (
                            <li key={j} className="text-white/70 flex items-start gap-1.5">
                              <span className="text-[#f2ca50] font-bold">·</span> {s}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3.5 px-4">
                        <ul className="space-y-1">
                          {c.weaknesses?.map((w, j) => (
                            <li key={j} className="text-rose-300/80 flex items-start gap-1.5">
                              <span className="text-rose-400 font-bold">·</span> {w}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </EditorialSection>
      )}

      {/* Go-to-Market Channels */}
      {result.go_to_market_channels?.length > 0 && (
        <EditorialSection title="Go-to-Market Channels">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
            {result.go_to_market_channels.map((ch, i) => (
              <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white">{ch.channel}</h4>
                  <p className="text-xs text-white/55 mt-1 leading-relaxed">{ch.rationale}</p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f2ca50]/20 bg-[#f2ca50]/10 px-3 py-1 text-xs font-semibold text-[#f2ca50]">
                    Est. CAC: {ch.estimated_cost_to_acquire}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Trends & Barriers - 2-Column Editorial Flow */}
      <div className="grid gap-8 lg:grid-cols-2 pt-2">
        <EditorialSection title="Market Dynamics & Trends">
          <TagList items={result.market_trends} />
        </EditorialSection>
        <EditorialSection title="Entry Barriers & Hurdles">
          <NumberedList items={result.entry_barriers} colorClass="text-rose-400" />
        </EditorialSection>
      </div>

      {/* Differentiation Opportunity & Risks */}
      <div className="grid gap-8 lg:grid-cols-2 pt-2 border-t border-white/8">
        <EditorialSection title="Differentiation Moat">
          <div className="border-l-2 border-[#f2ca50]/50 pl-4 py-1">
            <p className="text-sm text-white/80 leading-relaxed italic">
              "{result.differentiation_opportunity}"
            </p>
          </div>
        </EditorialSection>
        {result.key_risks?.length > 0 && (
          <EditorialSection title="Key Strategic Risks">
            <NumberedList items={result.key_risks} colorClass="text-rose-400" />
          </EditorialSection>
        )}
      </div>
    </div>
  );
}

function FeasibilityResult({ result }) {
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
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{dim.assessment}</p>
                  {dim.recommendations?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f2ca50] mb-1.5">Advice:</p>
                      <ul className="space-y-1">
                        {dim.recommendations.map((r, j) => (
                          <li key={j} className="text-xs text-white/60 flex items-start gap-2">
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
                  <p className="text-xs text-white/55 mt-0.5">{p.rationale}</p>
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

function BusinessPlanResult({ result }) {
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
          <p className="text-sm leading-relaxed text-white/75">{result.problem_statement}</p>
        </EditorialSection>
        <EditorialSection title="The Solution">
          <p className="text-sm leading-relaxed text-white/75">{result.solution_description}</p>
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
                    <p className="text-xs text-white/55 mt-0.5">{rs.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.business_model.pricing_strategy && (
            <div className="mb-6 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Pricing Strategy</span>
              <p className="text-xs sm:text-sm text-white/80">{result.business_model.pricing_strategy}</p>
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
            <div className="flex flex-wrap items-center gap-6 mt-4 text-xs text-white/60">
              <span>Break-even Target: <strong className="text-white font-medium">{result.financial_projections.break_even_timeline}</strong></span>
              <span>Capital Required: <strong className="text-[#f2ca50] font-medium">{result.financial_projections.funding_required}</strong></span>
            </div>
          )}
        </EditorialSection>
      )}

      {/* Marketing Strategy */}
      {result.marketing_strategy && (
        <EditorialSection title="Go-to-Market & Acquisition">
          <p className="text-sm text-white/70 mb-4">{result.marketing_strategy.positioning}</p>
          <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-xl border border-white/8 bg-white/[0.02] text-xs">
            <div>
              <span className="font-semibold text-white/90 block mb-1">Acquisition Loop</span>
              <p className="text-white/60 leading-relaxed">{result.marketing_strategy.acquisition_strategy}</p>
            </div>
            <div>
              <span className="font-semibold text-white/90 block mb-1">Retention Strategy</span>
              <p className="text-white/60 leading-relaxed">{result.marketing_strategy.retention_strategy}</p>
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
                    <p className="text-white/45 mt-0.5">{m.success_metric}</p>
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
                  <p className="text-xs text-white/60 mt-0.5">{r.mitigation}</p>
                </div>
              ))}
            </div>
          </EditorialSection>
        )}
      </div>
    </div>
  );
}

function ExecutionRoadmapResult({ result }) {
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

function ResultRenderer({ analysisKey, result }) {
  if (!result) return null;
  switch (analysisKey) {
    case "market_analysis": return <MarketAnalysisResult result={result} />;
    case "feasibility_analysis": return <FeasibilityResult result={result} />;
    case "business_plan": return <BusinessPlanResult result={result} />;
    case "execution_roadmap": return <ExecutionRoadmapResult result={result} />;
    default: return (
      <pre className="text-xs text-white/60 bg-white/5 rounded-xl p-4 overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  }
}

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
