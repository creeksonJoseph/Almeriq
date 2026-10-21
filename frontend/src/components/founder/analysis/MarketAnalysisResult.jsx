import React from "react";
import {
  StatStrip,
  EditorialSection,
  ExecutiveBanner,
} from "../../ui/BorderlessPrimitives";
import { TagList, NumberedList } from "./AnalysisSharedComponents";

export default function MarketAnalysisResult({ result }) {
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

      {/* Competitive Landscape */}
      {result.competitive_landscape?.length > 0 && (
        <EditorialSection title="Competitive Landscape & Incumbents">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
            {result.competitive_landscape.map((c, i) => (
              <div key={i} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-white">{c.competitor}</h4>
                  {c.market_share_estimate && (
                    <span className="text-xs text-white/45">
                      Est. Share: <strong className="text-white/75">{c.market_share_estimate}</strong>
                    </span>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  {c.strengths?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 block mb-1.5">Their Strengths</span>
                      <TagList items={c.strengths} colorClass="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" />
                    </div>
                  )}
                  {c.weaknesses?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/80 block mb-1.5">Where They Fall Short</span>
                      <TagList items={c.weaknesses} colorClass="bg-rose-500/10 text-rose-300 border border-rose-500/20" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Differentiation Opportunity */}
      {result.differentiation_opportunity && (
        <EditorialSection title="Your Unfair Advantage & Wedge">
          <div className="border-l-2 border-[#f2ca50] pl-4 py-1">
            <p className="text-sm sm:text-base leading-relaxed text-white/90 font-medium">
              {result.differentiation_opportunity}
            </p>
          </div>
        </EditorialSection>
      )}

      {/* Market Trends & Entry Barriers */}
      <div className="grid gap-8 lg:grid-cols-2 pt-2 border-t border-white/8">
        {result.market_trends?.length > 0 && (
          <EditorialSection title="Emerging Market Trends">
            <NumberedList items={result.market_trends} />
          </EditorialSection>
        )}
        {result.entry_barriers?.length > 0 && (
          <EditorialSection title="Key Barriers to Entry">
            <NumberedList items={result.entry_barriers} colorClass="text-rose-400" />
          </EditorialSection>
        )}
      </div>

      {/* Go-To-Market Channels */}
      {result.go_to_market_channels?.length > 0 && (
        <EditorialSection title="Recommended Go-To-Market Channels">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.go_to_market_channels.map((ch, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <h4 className="text-sm font-semibold text-white mb-1">{ch.channel}</h4>
                <p className="text-xs text-white/60 leading-relaxed mb-3">{ch.rationale}</p>
                {ch.estimated_cost_to_acquire && (
                  <span className="text-[11px] font-mono text-[#f2ca50] bg-[#f2ca50]/10 px-2 py-0.5 rounded-md border border-[#f2ca50]/20 inline-block">
                    Est. CAC: {ch.estimated_cost_to_acquire}
                  </span>
                )}
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Key Risks */}
      {result.key_risks?.length > 0 && (
        <EditorialSection title="Key Market Risks to Mitigate">
          <NumberedList items={result.key_risks} colorClass="text-rose-400" />
        </EditorialSection>
      )}
    </div>
  );
}
