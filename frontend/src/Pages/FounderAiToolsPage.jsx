import React, { useState, useEffect } from "react";
import {
  Cpu,
  RefreshCw,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { listVenturesApi, executeAiToolApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { StatStrip } from "../components/ui/BorderlessPrimitives";
import { useActiveIdea } from "../context/IdeaContext";

const AI_TOOLS = [
  { id: "lean_canvas", label: "Lean Canvas (1-Page)", desc: "Quick 1-page business blueprint" },
  { id: "swot", label: "SWOT Analysis", desc: "Strengths, weaknesses & opportunities" },
  { id: "pitch_deck", label: "Pitch Deck (10 Slides)", desc: "10 slides to explain your idea" },
  { id: "financial_model", label: "Financial Model", desc: "12-month money forecast and costs" },
  { id: "risk_matrix", label: "Risk Matrix", desc: "What could go wrong & mitigations" },
];

export default function FounderAiToolsPage() {
  const { showToast } = useToast();
  const {
    ventures,
    activeVenture,
    activeVentureId,
    setActiveVentureId,
  } = useActiveIdea();
  const [activeTab, setActiveTab] = useState("lean_canvas");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Active brief inputs
  const [briefInput, setBriefInput] = useState({
    idea: "",
    customer: "",
    location: "",
    problem: "",
    solution: "",
  });

  // Tool outputs state
  const [toolResults, setToolResults] = useState({});
  const [toolLoading, setToolLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const applyVentureBrief = (v) => {
    if (!v) return;
    setBriefInput({
      idea: v.idea || "",
      customer: v.customer || "",
      location: v.location || "",
      problem: v.problem || "",
      solution: v.solution || "",
    });
  };

  // Sync brief when global active venture changes
  useEffect(() => {
    if (activeVenture) {
      applyVentureBrief(activeVenture);
      setToolResults({});
    }
  }, [activeVenture?.id]);

  const handleSelectVenture = (e) => {
    const id = e.target.value;
    setActiveVentureId(id);
    const found = ventures.find((v) => String(v.id) === String(id));
    if (found) {
      applyVentureBrief(found);
      setToolResults({}); // Clear cached view to force reload with new brief
    }
  };

  const fetchToolResult = async (refresh = false) => {
    if (!briefInput.idea || briefInput.idea.length < 5) {
      showToast("Please provide at least a brief venture idea before running tools.", "error");
      return;
    }

    setToolLoading(true);
    try {
      const res = await executeAiToolApi({
        tool_key: activeTab,
        idea: briefInput.idea,
        customer: briefInput.customer,
        location: briefInput.location,
        problem: briefInput.problem,
        solution: briefInput.solution,
        extra_params: refresh ? { refresh: true } : {},
      });

      setToolResults((prev) => ({
        ...prev,
        [activeTab]: {
          result: res.result,
          source: res.source,
        },
      }));

      if (refresh) {
        showToast(`Regenerated ${AI_TOOLS.find((t) => t.id === activeTab)?.label}`, "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to generate deliverable", "error");
    } finally {
      setToolLoading(false);
    }
  };

  // Auto-fetch on tab change if brief exists and not loaded yet
  useEffect(() => {
    if (briefInput.idea && !toolResults[activeTab]) {
      fetchToolResult(false);
    }
  }, [activeTab, briefInput.idea]);

  const currentData = toolResults[activeTab]?.result;
  const currentSource = toolResults[activeTab]?.source;

  const handleCopy = () => {
    if (!currentData) return;
    navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
    setCopied(true);
    showToast("Deliverable copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Startup Tools"
          subtitle="Generate 1-page plans, pitch slide notes, and money estimates for your idea."
        />

        {/* Startup Idea Context Bar */}
        <div className="mb-6 rounded-2xl border border-[#2B2B31] bg-[#141417] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A15A]">
                Your Startup Idea
              </span>
              <p className="mt-1 text-xs text-[#9B9A94]">
                These tools use this idea to generate each document below.
              </p>
            </div>
            {ventures.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5F5E5A]">Saved Idea:</span>
                <select
                  value={activeVentureId ? String(activeVentureId) : ""}
                  onChange={handleSelectVenture}
                  className="rounded-lg border border-[#2B2B31] bg-[#1C1C21] px-3 py-1.5 text-xs text-[#F3F1EC] focus:border-[#C9A15A] focus:outline-none"
                >
                  {ventures.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.idea.slice(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Idea Edit / Preview */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-[#9B9A94]">Startup Idea</label>
                <span className={`text-[10px] font-medium ${
                  briefInput.idea.length > 450
                    ? "text-red-400"
                    : briefInput.idea.length > 400
                      ? "text-yellow-400"
                      : "text-white/45"
                }`}>
                  {briefInput.idea.length}/500
                </span>
              </div>
              <input
                type="text"
                maxLength={500}
                value={briefInput.idea}
                onChange={(e) => setBriefInput({ ...briefInput, idea: e.target.value })}
                placeholder="e.g. A marketplace for local students to buy and sell used books"
                className="mt-1 w-full rounded-lg border border-[#2B2B31] bg-[#1C1C21] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#C9A15A] focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-[#9B9A94]">Who is it for? (Audience & Location)</label>
                <span className={`text-[10px] font-medium ${
                  briefInput.customer.length > 180
                    ? "text-red-400"
                    : briefInput.customer.length > 150
                      ? "text-yellow-400"
                      : "text-white/45"
                }`}>
                  {briefInput.customer.length}/200
                </span>
              </div>
              <input
                type="text"
                maxLength={200}
                value={`${briefInput.customer || ""} ${briefInput.location ? `in ${briefInput.location}` : ""}`.trim()}
                onChange={(e) => setBriefInput({ ...briefInput, customer: e.target.value })}
                placeholder="e.g. Freight forwarders in Nairobi & Mombasa"
                className="mt-1 w-full rounded-lg border border-[#2B2B31] bg-[#1C1C21] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#C9A15A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tool Selectors - Clean Tab Bar */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {AI_TOOLS.map((tool) => {
            const active = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(tool.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#f2ca50]/15 text-[#f2ca50] border border-[#f2ca50]/30"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tool.label}
              </button>
            );
          })}
        </div>

        {/* Main Deliverable Display Box */}
        <div className="rounded-2xl border border-[#2B2B31] bg-[#141417] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#2B2B31] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-[#F3F1EC]">
                  {AI_TOOLS.find((t) => t.id === activeTab)?.label}
                </h3>
                {currentSource && (
                  <span className="rounded bg-[#1C1C21] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#C9A15A]">
                    {currentSource === "cache" ? "Saved Document" : "Generated"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#9B9A94]">
                {AI_TOOLS.find((t) => t.id === activeTab)?.desc}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!currentData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2B2B31] bg-[#1C1C21] px-3 py-1.5 text-xs font-medium text-[#9B9A94] transition-colors hover:text-white disabled:opacity-40"
              >
                {copied ? <Check size={14} className="text-[#3E8368]" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={() => fetchToolResult(true)}
                disabled={toolLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A15A]/30 bg-[#C9A15A]/10 px-3.5 py-1.5 text-xs font-semibold text-[#E8D6A8] transition-colors hover:bg-[#C9A15A]/20 disabled:opacity-60"
              >
                <RefreshCw size={14} className={toolLoading ? "animate-spin" : ""} />
                <span>{toolLoading ? "Generating..." : "Regenerate"}</span>
              </button>
            </div>
          </div>

          {toolLoading && (
            <div className="flex min-h-64 flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#C9A15A]" />
              <p className="mt-4 text-xs font-medium text-[#9B9A94]">
                Synthesizing {AI_TOOLS.find((t) => t.id === activeTab)?.label} with startup heuristics...
              </p>
            </div>
          )}

          {!toolLoading && !currentData && (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <Cpu size={32} className="text-[#5F5E5A]" />
              <p className="mt-3 text-sm text-[#9B9A94]">No deliverable loaded yet.</p>
              <button
                type="button"
                onClick={() => fetchToolResult(false)}
                className="mt-4 rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] px-5 py-2.5 text-xs font-semibold text-white"
              >
                Generate Deliverable Now
              </button>
            </div>
          )}

          {!toolLoading && currentData && (
            <div>
              {/* 1. LEAN CANVAS - Authentic 1-Page Strategy Board */}
              {activeTab === "lean_canvas" && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]">
                  {/* Top Tier (3 columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-b border-white/10">
                    <CanvasCell title="1. Problem" items={currentData.problem} badge="Top 3 Headaches" />
                    <CanvasCell
                      title="2. Unique Value Prop"
                      text={currentData.unique_value_prop}
                      highlight
                      badge="Single Clear Message"
                    />
                    <CanvasCell title="3. Customer Segments" items={currentData.customer_segments} badge="First Adopters" />
                  </div>

                  {/* Mid Tier (4 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border-b border-white/10">
                    <CanvasCell title="4. Solution" items={currentData.solution} />
                    <CanvasCell title="5. Unfair Advantage" text={currentData.unfair_advantage} />
                    <CanvasCell title="6. Channels" items={currentData.channels} />
                    <CanvasCell title="7. Key Metrics" items={currentData.key_metrics} />
                  </div>

                  {/* Bottom Tier (2 wide columns: Cost Structure & Revenue Streams) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <CanvasCell title="8. Cost Structure" items={currentData.cost_structure} />
                    <CanvasCell title="9. Revenue Streams" items={currentData.revenue_streams} highlight />
                  </div>
                </div>
              )}

              {/* 2. SWOT - 2x2 Intelligence Quadrant */}
              {activeTab === "swot" && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border-b border-white/10">
                    <div className="p-5 bg-gradient-to-br from-[#f2ca50]/[0.03] to-transparent">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#f2ca50]">Strengths</span>
                        <span className="text-[10px] text-white/40">Internal</span>
                      </div>
                      <ul className="space-y-2">
                        {safeList(currentData.strengths).map((it, i) => (
                          <li key={i} className="text-xs text-white/80 flex items-start gap-2">
                            <span className="text-[#f2ca50] font-bold">·</span> {typeof it === "object" ? JSON.stringify(it) : String(it)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-white/[0.01] to-transparent">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/60">Weaknesses</span>
                        <span className="text-[10px] text-white/40">Internal</span>
                      </div>
                      <ul className="space-y-2">
                        {safeList(currentData.weaknesses).map((it, i) => (
                          <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                            <span className="text-white/40 font-bold">·</span> {typeof it === "object" ? JSON.stringify(it) : String(it)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                    <div className="p-5 bg-gradient-to-br from-emerald-500/[0.03] to-transparent">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Opportunities</span>
                        <span className="text-[10px] text-white/40">External</span>
                      </div>
                      <ul className="space-y-2">
                        {safeList(currentData.opportunities).map((it, i) => (
                          <li key={i} className="text-xs text-white/80 flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">·</span> {typeof it === "object" ? JSON.stringify(it) : String(it)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-rose-500/[0.03] to-transparent">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Threats</span>
                        <span className="text-[10px] text-white/40">External</span>
                      </div>
                      <ul className="space-y-2">
                        {safeList(currentData.threats).map((it, i) => (
                          <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                            <span className="text-rose-400 font-bold">·</span> {typeof it === "object" ? JSON.stringify(it) : String(it)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PITCH DECK - Interactive Master-Detail Slide Presenter */}
              {activeTab === "pitch_deck" && currentData.slides && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Slide index rail */}
                  <div className="lg:col-span-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
                    <div className="p-3 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Slide Deck ({currentData.slides.length} Slides)
                      </span>
                      <span className="text-[10px] font-mono text-[#f2ca50]">
                        {activeSlideIndex + 1} / {currentData.slides.length}
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                      {currentData.slides.map((s, idx) => {
                        const isCurrent = idx === activeSlideIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveSlideIndex(idx)}
                            className={`w-full text-left p-3 flex items-center justify-between gap-2 text-xs transition-colors ${
                              isCurrent
                                ? "bg-[#f2ca50]/10 text-white font-semibold"
                                : "text-white/60 hover:bg-white/[0.02] hover:text-white"
                            }`}
                          >
                            <span className="truncate">
                              <span className="font-mono text-[#f2ca50] mr-2">{s.slide_number}.</span>
                              {s.title}
                            </span>
                            {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-[#f2ca50] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active slide stage */}
                  <div className="lg:col-span-8 flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 min-h-[340px]">
                    {currentData.slides[activeSlideIndex] && (
                      <div>
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#f2ca50]">
                              Slide {currentData.slides[activeSlideIndex].slide_number}
                            </span>
                            <h4 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                              {currentData.slides[activeSlideIndex].title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={activeSlideIndex === 0}
                              onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                              className="px-2.5 py-1 text-xs font-semibold rounded border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30"
                            >
                              Prev
                            </button>
                            <button
                              type="button"
                              disabled={activeSlideIndex === currentData.slides.length - 1}
                              onClick={() => setActiveSlideIndex((prev) => Math.min(currentData.slides.length - 1, prev + 1))}
                              className="px-2.5 py-1 text-xs font-semibold rounded border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30"
                            >
                              Next
                            </button>
                          </div>
                        </div>

                        <div className="py-6">
                          <ul className="space-y-3">
                            {safeList(currentData.slides[activeSlideIndex].bullets).map((b, bi) => (
                              <li key={bi} className="text-sm text-white/80 flex items-start gap-3 leading-relaxed">
                                <span className="text-[#f2ca50] text-sm mt-0.5">•</span>
                                <span>{typeof b === "object" ? JSON.stringify(b) : String(b)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {currentData.slides[activeSlideIndex].speaker_notes && (
                          <div className="pt-4 border-t border-white/8 text-xs text-white/50">
                            <span className="font-semibold text-white/70 block mb-1">Speaker Notes:</span>
                            <p className="leading-relaxed italic">
                              "{currentData.slides[activeSlideIndex].speaker_notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. FINANCIAL MODEL - Stat Strip + Trajectory Table */}
              {activeTab === "financial_model" && (
                <div className="space-y-6">
                  <StatStrip
                    items={[
                      { label: "Break-Even Units", value: currentData.break_even_units || "-", subtext: "Target sales to cover fixed costs" },
                      { label: "Estimated CAC", value: currentData.unit_economics?.cac || "-", subtext: "Acquisition cost per customer" },
                      { label: "Estimated LTV", value: currentData.unit_economics?.ltv || "-", subtext: "Expected lifetime value", valueColor: "text-[#f2ca50]" },
                    ]}
                  />

                  {currentData.projections_summary && (
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]">
                      <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                          12-Month Financial Trajectory Milestones
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                        <div className="p-5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Month 3</span>
                          <p className="mt-2 text-sm text-white/80 leading-relaxed">{currentData.projections_summary?.month_3}</p>
                        </div>
                        <div className="p-5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Month 6</span>
                          <p className="mt-2 text-sm text-white/80 leading-relaxed">{currentData.projections_summary?.month_6}</p>
                        </div>
                        <div className="p-5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] block">Month 12</span>
                          <p className="mt-2 text-sm text-white/90 leading-relaxed font-medium">{currentData.projections_summary?.month_12}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. RISK MATRIX - Borderless Assessment Table */}
              {activeTab === "risk_matrix" && currentData.risks && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="py-3 px-4 font-semibold uppercase tracking-wider text-white/40">Category</th>
                        <th className="py-3 px-4 font-semibold uppercase tracking-wider text-white/40">Risk Statement</th>
                        <th className="py-3 px-4 font-semibold uppercase tracking-wider text-white/40">Impact & Likelihood</th>
                        <th className="py-3 px-4 font-semibold uppercase tracking-wider text-white/40">Mitigation Strategy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {safeList(currentData.risks).map((r, ri) => (
                        <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#f2ca50]">
                              {r.category || "General"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-white max-w-xs">
                            {r.risk}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="rounded bg-white/5 px-2 py-0.5 text-white/70">Impact: {r.impact || "N/A"}</span>
                              <span className="rounded bg-[#f2ca50]/10 px-2 py-0.5 text-[#f2ca50]">Likelihood: {r.likelihood || "N/A"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white/60 max-w-sm leading-relaxed">
                            {r.mitigation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </FounderFlowGuard>
  );
}

function safeList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    if (val.includes("\n")) {
      return val
        .split("\n")
        .map((s) => s.trim().replace(/^[-*•0-9.]+\s*/, ""))
        .filter(Boolean);
    }
    return [val];
  }
  if (typeof val === "object") {
    return Object.values(val).map((v) =>
      typeof v === "object" ? JSON.stringify(v) : String(v)
    );
  }
  return [String(val)];
}

function CanvasCell({ title, items, text, highlight = false, badge }) {
  const list = items ? safeList(items) : [];
  return (
    <div className={`p-4 sm:p-5 flex flex-col justify-between ${highlight ? "bg-white/[0.02]" : ""}`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#f2ca50]">{title}</h5>
          {badge && <span className="text-[9px] uppercase tracking-wider text-white/30">{badge}</span>}
        </div>
        {text && (
          <p className="text-xs sm:text-sm leading-relaxed text-white/80 mb-2">
            {typeof text === "string" ? text : JSON.stringify(text)}
          </p>
        )}
        {list.length > 0 && (
          <ul className="space-y-1.5 text-xs text-white/70">
            {list.map((it, i) => (
              <li key={i} className="flex items-start gap-1.5 leading-snug">
                <span className="text-[#f2ca50] font-bold">·</span>
                <span>{typeof it === "object" ? JSON.stringify(it) : String(it)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
