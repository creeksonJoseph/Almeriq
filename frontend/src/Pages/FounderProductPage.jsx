import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { listVenturesApi, executeAiToolApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { useActiveIdea } from "../context/IdeaContext";

const PRODUCT_TOOLS = [
  { id: "user_personas", label: "User Profiles", desc: "Who your users are & what they need" },
  { id: "user_journey", label: "User Steps", desc: "How users discover and use your app" },
  { id: "tech_stack", label: "Tech Stack", desc: "Tools and frameworks to build it" },
  { id: "sprint_backlog", label: "To-Do List", desc: "What features to code and build first" },
];

export default function FounderProductPage() {
  const { showToast } = useToast();
  const { activeVenture } = useActiveIdea();
  const [activeTab, setActiveTab] = useState("user_personas");
  const [brief, setBrief] = useState({
    idea: "",
    customer: "",
    location: "",
  });
  const [toolResults, setToolResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeVenture) {
      setBrief({
        idea: activeVenture.idea || "",
        customer: activeVenture.customer || "",
        location: activeVenture.location || "",
      });
      setToolResults({});
    }
  }, [activeVenture?.id]);

  const fetchTool = async (refresh = false) => {
    const ideaText = brief.idea || "Modern SaaS platform";
    setLoading(true);
    try {
      const res = await executeAiToolApi({
        tool_key: activeTab,
        idea: ideaText,
        customer: brief.customer,
        location: brief.location,
        extra_params: refresh ? { refresh: true } : {},
      });
      setToolResults((prev) => ({
        ...prev,
        [activeTab]: res.result,
      }));
      if (refresh) {
        showToast("Deliverable regenerated", "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to generate tool output", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!toolResults[activeTab]) {
      fetchTool(false);
    }
  }, [activeTab, brief.idea]);

  const currentData = toolResults[activeTab];

  const handleCopy = () => {
    if (!currentData) return;
    navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
    setCopied(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Product Development"
          subtitle="Plan who your users are, how the app will work, and what tech to use."
        />

        {activeVenture && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs">
            <span className="font-semibold text-[#f2ca50]">Active Idea:</span>
            <span className="font-medium text-white">{activeVenture.name || activeVenture.idea}</span>
            {activeVenture.name && activeVenture.idea && (
              <span className="text-white/60 truncate max-w-md hidden sm:inline">· {activeVenture.idea}</span>
            )}
          </div>
        )}

        {/* Tab Selection - Clean Horizontal Bar */}
        <div className="mb-10 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {PRODUCT_TOOLS.map((tool) => {
            const active = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(tool.id)}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#f2ca50]/15 text-[#f2ca50]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tool.label}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="py-2">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 pb-5">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                {PRODUCT_TOOLS.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="mt-2 text-sm text-white/70 max-w-xl">
                {PRODUCT_TOOLS.find((t) => t.id === activeTab)?.desc}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!currentData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white disabled:opacity-40"
              >
                {copied ? <Check size={14} className="text-[#3E8368]" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={() => fetchTool(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-[#f2ca50]/30 bg-[#f2ca50]/10 px-4 py-2 text-xs font-semibold text-[#f2ca50] transition-colors hover:bg-[#f2ca50]/20 disabled:opacity-60"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Generating..." : "Regenerate"}</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex min-h-64 flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#C9A15A]" />
              <p className="mt-4 text-xs font-medium text-white">
                Synthesizing product specifications with engineering heuristics...
              </p>
            </div>
          )}

          {!loading && currentData && (
            <div>
              {/* PERSONAS - Profile Split */}
              {activeTab === "user_personas" && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/10">
                  {safeList(currentData.personas).map((p, idx) => (
                    <div key={idx} className="p-6 sm:p-7 hover:bg-white/[0.02] transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="md:w-1/3">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-display text-lg font-bold text-white">{p.name}</h4>
                            <span className="rounded bg-[#f2ca50]/10 border border-[#f2ca50]/20 px-2 py-0.5 text-[10px] font-semibold text-[#f2ca50]">
                              {p.role}
                            </span>
                          </div>
                          <blockquote className="mt-2 border-l-2 border-[#f2ca50]/50 pl-3 text-xs italic text-white leading-relaxed">
                            "{p.quote}"
                          </blockquote>
                        </div>

                        <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-white/8 md:pl-6">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] block mb-2">
                              Primary Goals
                            </span>
                            <ul className="space-y-1.5 text-xs text-white">
                              {safeList(p.goals).map((g, gi) => (
                                <li key={gi} className="flex items-start gap-1.5">
                                  <span className="text-[#f2ca50] font-bold">·</span>
                                  <span>{typeof g === "object" ? JSON.stringify(g) : String(g)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-2">
                              Friction & Pain Points
                            </span>
                            <ul className="space-y-1.5 text-xs text-rose-200/80">
                              {safeList(p.pain_points).map((pp, ppi) => (
                                <li key={ppi} className="flex items-start gap-1.5">
                                  <span className="text-rose-400 font-bold">·</span>
                                  <span>{typeof pp === "object" ? JSON.stringify(pp) : String(pp)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* USER JOURNEY - Streamlined Flow Rows */}
              {activeTab === "user_journey" && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
                  {safeList(currentData.steps).map((step, idx) => (
                    <div key={idx} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f2ca50]/15 text-xs font-bold text-[#f2ca50]">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white">{step.stage}</h4>
                        </div>
                        <span className="rounded bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/60">
                          State: {step.emotion}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs pl-7">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block">User Action</span>
                          <p className="mt-1 text-white leading-relaxed">{step.user_action}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block">Touchpoint</span>
                          <p className="mt-1 text-white leading-relaxed font-mono text-[11px]">{step.touchpoint}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block">Product Opportunity</span>
                          <p className="mt-1 text-emerald-300/90 leading-relaxed font-medium">{step.opportunity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TECH STACK - Unified Architectural Spec Table */}
              {activeTab === "tech_stack" && (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02]">
                          <th className="py-3 px-5 font-semibold uppercase tracking-wider text-white/40 w-1/3">Architecture Layer</th>
                          <th className="py-3 px-5 font-semibold uppercase tracking-wider text-white/40">Recommended Tech</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5 font-medium text-white">Frontend Client</td>
                          <td className="py-3.5 px-5 font-semibold text-white text-sm">{currentData.frontend}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5 font-medium text-white">Backend & API</td>
                          <td className="py-3.5 px-5 font-semibold text-white text-sm">{currentData.backend}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5 font-medium text-white">Database Layer</td>
                          <td className="py-3.5 px-5 font-semibold text-white text-sm">{currentData.database}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5 font-medium text-white">Hosting & Infrastructure</td>
                          <td className="py-3.5 px-5 font-semibold text-[#f2ca50] text-sm">{currentData.infrastructure}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {currentData.third_party_services && (
                    <div className="p-5 rounded-xl border border-white/10 bg-white/[0.01]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] block mb-2">
                        Integrated 3rd-Party APIs & Services
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {safeList(currentData.third_party_services).map((s, si) => (
                          <span key={si} className="rounded-md border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-white">
                            {typeof s === "object" ? JSON.stringify(s) : String(s)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentData.rationale && (
                    <div className="border-l-2 border-white/20 pl-4 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                        Velocity & Scale Rationale
                      </span>
                      <p className="text-xs sm:text-sm leading-relaxed text-white">
                        {currentData.rationale}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SPRINT BACKLOG - Clean Epic Stream */}
              {activeTab === "sprint_backlog" && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
                  {safeList(currentData.mvp_epics).map((epic, idx) => (
                    <div key={idx} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#f2ca50]">EP-{idx + 1}</span>
                          <h4 className="text-sm font-bold text-white">{epic.epic}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[#f2ca50]/10 border border-[#f2ca50]/20 px-2 py-0.5 text-[10px] font-semibold text-[#f2ca50]">
                            {epic.priority} Priority
                          </span>
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/50">
                            Est: {epic.estimate}
                          </span>
                        </div>
                      </div>
                      <div className="pl-6 pt-1">
                        <ul className="space-y-1 text-xs text-white">
                          {safeList(epic.user_stories).map((story, si) => (
                            <li key={si} className="flex items-start gap-1.5">
                              <span className="text-[#f2ca50] font-bold">·</span>
                              <span>{typeof story === "object" ? JSON.stringify(story) : String(story)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
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

