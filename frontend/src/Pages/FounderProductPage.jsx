import React, { useState, useEffect } from "react";
import {
  Boxes,
  Users,
  Compass,
  Code2,
  ListTodo,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { listVenturesApi, executeAiToolApi } from "../lib/api";
import { useToast } from "../context/ToastContext";

const PRODUCT_TOOLS = [
  { id: "user_personas", label: "User Personas", icon: Users, desc: "Detailed customer archetypes & pain points" },
  { id: "user_journey", label: "User Journey", icon: Compass, desc: "End-to-end customer onboarding & aha moment" },
  { id: "tech_stack", label: "Tech Stack Spec", icon: Code2, desc: "Architecture, frameworks & API recommendations" },
  { id: "sprint_backlog", label: "Sprint Backlog", icon: ListTodo, desc: "MVP user stories, priorities & estimates" },
];

export default function FounderProductPage() {
  const { showToast } = useToast();
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
    async function init() {
      try {
        const list = await listVenturesApi();
        if (Array.isArray(list) && list.length > 0) {
          setBrief({
            idea: list[0].idea || "",
            customer: list[0].customer || "",
            location: list[0].location || "",
          });
        }
      } catch (err) {
        // default
      }
    }
    init();
  }, []);

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
          title="Product Development Studio"
          subtitle="Turn abstract hypotheses into actionable product specifications, user journeys, and engineering backlogs."
        />

        {/* Tab Selection */}
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRODUCT_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const active = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(tool.id)}
                className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                  active
                    ? "border-[#C9A15A] bg-[#C9A15A]/15 text-[#E8D6A8] shadow-md"
                    : "border-[#2B2B31] bg-[#141417] text-[#9B9A94] hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon size={20} className={active ? "text-[#C9A15A]" : "text-[#5F5E5A]"} />
                <span className="mt-2.5 text-xs font-semibold">{tool.label}</span>
                <span className="mt-1 hidden text-[11px] text-[#5F5E5A] sm:inline">{tool.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="rounded-2xl border border-[#2B2B31] bg-[#141417] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#2B2B31] pb-5">
            <div>
              <h3 className="font-display text-xl font-bold text-[#F3F1EC]">
                {PRODUCT_TOOLS.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="mt-1 text-xs text-[#9B9A94]">
                {PRODUCT_TOOLS.find((t) => t.id === activeTab)?.desc}
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
                onClick={() => fetchTool(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A15A]/30 bg-[#C9A15A]/10 px-3.5 py-1.5 text-xs font-semibold text-[#E8D6A8] transition-colors hover:bg-[#C9A15A]/20 disabled:opacity-60"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Generating..." : "Regenerate"}</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex min-h-64 flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#C9A15A]" />
              <p className="mt-4 text-xs font-medium text-[#9B9A94]">
                Synthesizing product specifications with engineering heuristics...
              </p>
            </div>
          )}

          {!loading && currentData && (
            <div>
              {/* PERSONAS */}
              {activeTab === "user_personas" && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {currentData.personas?.map((p, idx) => (
                    <div key={idx} className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-base font-bold text-[#F3F1EC]">{p.name}</h4>
                        <span className="rounded bg-[#2B2B31] px-2 py-0.5 text-[10px] text-[#C9A15A]">{p.role}</span>
                      </div>
                      <blockquote className="mt-3 border-l-2 border-[#C9A15A] pl-3 text-xs italic text-[#9B9A94]">
                        "{p.quote}"
                      </blockquote>
                      <div className="mt-4">
                        <span className="text-[11px] font-semibold text-white/70">Key Goals:</span>
                        <ul className="mt-1 list-inside list-disc text-xs text-[#F3F1EC]">
                          {p.goals?.map((g, gi) => (
                            <li key={gi}>{g}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3">
                        <span className="text-[11px] font-semibold text-rose-300/80">Pain Points:</span>
                        <ul className="mt-1 list-inside list-disc text-xs text-[#9B9A94]">
                          {p.pain_points?.map((pp, ppi) => (
                            <li key={ppi}>{pp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* USER JOURNEY */}
              {activeTab === "user_journey" && (
                <div className="space-y-4">
                  {currentData.steps?.map((step, idx) => (
                    <div key={idx} className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2B2B31] pb-2">
                        <h4 className="text-sm font-bold text-[#C9A15A]">{step.stage}</h4>
                        <span className="rounded bg-[#2B2B31] px-2 py-0.5 text-[10px] text-[#E8D6A8]">
                          Emotion: {step.emotion}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                        <div>
                          <span className="text-[10px] text-[#5F5E5A]">User Action</span>
                          <p className="mt-1 text-[#F3F1EC]">{step.user_action}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#5F5E5A]">Touchpoint</span>
                          <p className="mt-1 text-[#F3F1EC]">{step.touchpoint}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#5F5E5A]">Product Opportunity</span>
                          <p className="mt-1 text-[#52b788]">{step.opportunity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TECH STACK */}
              {activeTab === "tech_stack" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <StackCard label="Frontend Framework" value={currentData.frontend} />
                    <StackCard label="Backend & API" value={currentData.backend} />
                    <StackCard label="Database Layer" value={currentData.database} />
                    <StackCard label="Hosting & Infrastructure" value={currentData.infrastructure} />
                  </div>
                  {currentData.third_party_services && (
                    <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A15A]">
                        Integrated 3rd-Party APIs
                      </span>
                      <ul className="mt-2 list-inside list-disc text-xs text-[#F3F1EC]">
                        {currentData.third_party_services.map((s, si) => (
                          <li key={si}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentData.rationale && (
                    <div className="rounded-xl border border-[#2B2B31] bg-[#141417] p-5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9B9A94]">
                        Velocity & Scale Rationale
                      </span>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#F3F1EC]">
                        {currentData.rationale}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SPRINT BACKLOG */}
              {activeTab === "sprint_backlog" && (
                <div className="space-y-4">
                  {currentData.mvp_epics?.map((epic, idx) => (
                    <div key={idx} className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2B2B31] pb-2">
                        <h4 className="text-sm font-bold text-[#F3F1EC]">{epic.epic}</h4>
                        <div className="flex gap-2">
                          <span className="rounded bg-[#2B2B31] px-2 py-0.5 text-[10px] text-[#C9A15A]">
                            Priority: {epic.priority}
                          </span>
                          <span className="rounded bg-[#2B2B31] px-2 py-0.5 text-[10px] text-white/50">
                            Est: {epic.estimate}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5F5E5A]">
                          User Stories
                        </span>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-[#9B9A94]">
                          {epic.user_stories?.map((story, si) => (
                            <li key={si} className="text-[#F3F1EC]">{story}</li>
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

function StackCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
      <span className="text-[10px] uppercase tracking-wider text-[#5F5E5A]">{label}</span>
      <p className="mt-1.5 font-display text-sm font-semibold text-[#F3F1EC]">{value}</p>
    </div>
  );
}
