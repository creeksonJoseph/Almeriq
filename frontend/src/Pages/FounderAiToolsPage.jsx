import React, { useState, useEffect } from "react";
import {
  Cpu,
  RefreshCw,
  Copy,
  Check,
  Download,
  Sparkles,
  BarChart3,
  Layers,
  Presentation,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { listVenturesApi, executeAiToolApi } from "../lib/api";
import { useToast } from "../context/ToastContext";

const AI_TOOLS = [
  { id: "lean_canvas", label: "Lean Canvas", icon: Layers, desc: "9-block rapid business blueprint" },
  { id: "swot", label: "SWOT Analysis", icon: BarChart3, desc: "Strategic strengths & external threats" },
  { id: "pitch_deck", label: "Pitch Deck (10 Slides)", icon: Presentation, desc: "Investor deck outline with speaker notes" },
  { id: "financial_model", label: "Financial Projections", icon: TrendingUp, desc: "12-month trajectory & unit economics" },
  { id: "risk_matrix", label: "Risk Matrix", icon: AlertTriangle, desc: "Likelihood, impact & mitigation strategy" },
];

export default function FounderAiToolsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("lean_canvas");
  const [ventures, setVentures] = useState([]);
  const [selectedVentureId, setSelectedVentureId] = useState("");
  const [loadingVentures, setLoadingVentures] = useState(true);

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

  useEffect(() => {
    async function loadVentures() {
      try {
        const data = await listVenturesApi();
        if (Array.isArray(data) && data.length > 0) {
          setVentures(data);
          setSelectedVentureId(String(data[0].id));
          applyVentureBrief(data[0]);
        }
      } catch (err) {
        // no saved ventures yet
      } finally {
        setLoadingVentures(false);
      }
    }
    loadVentures();
  }, []);

  const applyVentureBrief = (v) => {
    setBriefInput({
      idea: v.idea || "",
      customer: v.customer || "",
      location: v.location || "",
      problem: v.problem || "",
      solution: v.solution || "",
    });
  };

  const handleSelectVenture = (e) => {
    const id = e.target.value;
    setSelectedVentureId(id);
    const found = ventures.find((v) => String(v.id) === String(id));
    if (found) {
      applyVentureBrief(found);
      setToolResults({}); // Clear cached view to force reload with new brief
    }
  };

  const fetchToolResult = async (refresh = false) => {
    if (!briefInput.idea || briefInput.idea.length < 5) {
      showToast("Please provide at least a brief venture idea before running AI tools.", "error");
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
        showToast(`Regenerated ${AI_TOOLS.find((t) => t.id === activeTab)?.label} with Gemini`, "success");
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
          title="AI Business Builder"
          subtitle="Generate institutional-grade startup deliverables powered by Google Gemini intelligence."
        />

        {/* Venture Brief Context Bar */}
        <div className="mb-8 rounded-2xl border border-[#2B2B31] bg-[#141417] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A15A]">
                Source Venture Brief
              </span>
              <p className="mt-1 text-xs text-[#9B9A94]">
                The AI tools dynamically synthesize deliverables tailored to your idea's customer & market.
              </p>
            </div>
            {ventures.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5F5E5A]">Saved Brief:</span>
                <select
                  value={selectedVentureId}
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
              <label className="text-[11px] font-medium text-[#9B9A94]">Venture Idea</label>
              <input
                type="text"
                value={briefInput.idea}
                onChange={(e) => setBriefInput({ ...briefInput, idea: e.target.value })}
                placeholder="e.g. B2B payments orchestrator for East African cross-border logistics"
                className="mt-1 w-full rounded-lg border border-[#2B2B31] bg-[#1C1C21] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#C9A15A] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#9B9A94]">Target Customer & Region</label>
              <input
                type="text"
                value={`${briefInput.customer || ""} ${briefInput.location ? `in ${briefInput.location}` : ""}`.trim()}
                onChange={(e) => setBriefInput({ ...briefInput, customer: e.target.value })}
                placeholder="e.g. Freight forwarders in Nairobi & Mombasa"
                className="mt-1 w-full rounded-lg border border-[#2B2B31] bg-[#1C1C21] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#C9A15A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tool Selectors */}
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {AI_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const active = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(tool.id)}
                className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all ${
                  active
                    ? "border-[#C9A15A] bg-[#C9A15A]/15 text-[#E8D6A8] shadow-md"
                    : "border-[#2B2B31] bg-[#141417] text-[#9B9A94] hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon size={18} className={active ? "text-[#C9A15A]" : "text-[#5F5E5A]"} />
                <span className="mt-2 text-xs font-semibold">{tool.label}</span>
                <span className="mt-0.5 hidden text-[10px] text-[#5F5E5A] sm:inline">{tool.desc}</span>
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
                    {currentSource === "gemini" ? "Gemini AI Live" : currentSource === "cache" ? "Fast Cached" : "Offline Model"}
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
                className="mt-4 rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B]"
              >
                Generate Deliverable Now
              </button>
            </div>
          )}

          {!toolLoading && currentData && (
            <div>
              {/* 1. LEAN CANVAS */}
              {activeTab === "lean_canvas" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <CanvasBlock title="Problem" items={currentData.problem} />
                  <CanvasBlock title="Solution" items={currentData.solution} />
                  <CanvasBlock title="Unique Value Prop" text={currentData.unique_value_prop} />
                  <CanvasBlock title="Customer Segments" items={currentData.customer_segments} />
                  <CanvasBlock title="Unfair Advantage" text={currentData.unfair_advantage} />
                  <CanvasBlock title="Channels" items={currentData.channels} />
                  <CanvasBlock title="Key Metrics" items={currentData.key_metrics} />
                  <CanvasBlock title="Cost Structure" items={currentData.cost_structure} />
                  <CanvasBlock title="Revenue Streams" items={currentData.revenue_streams} />
                </div>
              )}

              {/* 2. SWOT */}
              {activeTab === "swot" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SwotBox title="Strengths" items={currentData.strengths} color="border-emerald-500/30 text-emerald-400 bg-emerald-500/5" />
                  <SwotBox title="Weaknesses" items={currentData.weaknesses} color="border-amber-500/30 text-amber-400 bg-amber-500/5" />
                  <SwotBox title="Opportunities" items={currentData.opportunities} color="border-blue-500/30 text-blue-400 bg-blue-500/5" />
                  <SwotBox title="Threats" items={currentData.threats} color="border-rose-500/30 text-rose-400 bg-rose-500/5" />
                </div>
              )}

              {/* 3. PITCH DECK */}
              {activeTab === "pitch_deck" && (
                <div className="space-y-4">
                  {currentData.slides?.map((slide, idx) => (
                    <div key={idx} className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-4">
                      <div className="flex items-center justify-between border-b border-[#2B2B31] pb-2">
                        <span className="text-xs font-semibold text-[#C9A15A]">
                          Slide {slide.slide_number}: {slide.title}
                        </span>
                      </div>
                      <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-[#F3F1EC]">
                        {slide.bullets?.map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                      </ul>
                      {slide.speaker_notes && (
                        <div className="mt-3 rounded-lg bg-[#0A0A0B] p-2.5 text-[11px] text-[#9B9A94]">
                          <strong className="text-white/60">Speaker notes:</strong> {slide.speaker_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 4. FINANCIAL MODEL */}
              {activeTab === "financial_model" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatBox label="Break-Even Units" value={currentData.break_even_units} />
                    <StatBox label="Est. CAC" value={currentData.unit_economics?.cac} />
                    <StatBox label="Est. LTV" value={currentData.unit_economics?.ltv} />
                  </div>
                  <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-4">
                    <h4 className="text-xs font-semibold uppercase text-[#C9A15A]">12-Month Trajectory</h4>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                      <div className="rounded-lg bg-[#141417] p-3">
                        <span className="text-[10px] text-[#5F5E5A]">Month 3</span>
                        <p className="mt-1 text-[#F3F1EC]">{currentData.projections_summary?.month_3}</p>
                      </div>
                      <div className="rounded-lg bg-[#141417] p-3">
                        <span className="text-[10px] text-[#5F5E5A]">Month 6</span>
                        <p className="mt-1 text-[#F3F1EC]">{currentData.projections_summary?.month_6}</p>
                      </div>
                      <div className="rounded-lg bg-[#141417] p-3">
                        <span className="text-[10px] text-[#5F5E5A]">Month 12</span>
                        <p className="mt-1 text-[#F3F1EC]">{currentData.projections_summary?.month_12}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. RISK MATRIX */}
              {activeTab === "risk_matrix" && (
                <div className="space-y-3">
                  {currentData.risks?.map((r, ri) => (
                    <div key={ri} className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded bg-[#2B2B31] px-2 py-0.5 text-[10px] font-semibold text-[#E8D6A8]">
                          {r.category}
                        </span>
                        <div className="flex gap-2 text-[10px]">
                          <span className="rounded bg-rose-500/10 px-2 py-0.5 text-rose-400">Impact: {r.impact}</span>
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-400">Likelihood: {r.likelihood}</span>
                        </div>
                      </div>
                      <h5 className="mt-2 text-sm font-semibold text-[#F3F1EC]">{r.risk}</h5>
                      <p className="mt-1.5 text-xs text-[#9B9A94]">
                        <strong className="text-white/60">Mitigation:</strong> {r.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </FounderFlowGuard>
  );
}

function CanvasBlock({ title, items, text }) {
  return (
    <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-4">
      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A15A]">{title}</h5>
      {text && <p className="mt-2 text-xs leading-relaxed text-[#F3F1EC]">{text}</p>}
      {items && (
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[#F3F1EC]">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SwotBox({ title, items, color }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <h5 className="text-xs font-semibold uppercase tracking-wider">{title}</h5>
      <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs text-[#F3F1EC]">
        {items?.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-4">
      <span className="text-[10px] uppercase text-[#5F5E5A]">{label}</span>
      <p className="mt-1 font-display text-xl font-bold text-[#F3F1EC]">{value || "—"}</p>
    </div>
  );
}
