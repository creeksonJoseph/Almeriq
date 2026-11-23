import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  RefreshCw,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import FounderStudioNav from "../../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../../components/founder/FounderFlowLayout";
import { listVenturesApi, executeAiToolApi } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { useActiveIdea } from "../../context/IdeaContext";
import { Skeleton, SkeletonText } from "../../components/ui";

const PRODUCT_TOOLS = [
  { id: "product_brief", label: "1. Product Brief", desc: "Define the core product, target customer, and key features" },
  { id: "mvp_building", label: "2. MVP Building", desc: "Generate a working prototype and MVP plan" },
  { id: "investor_summary", label: "3. Investor-Ready Summary", desc: "Create a summary for the investor page" },
  { id: "design", label: "4. Design", desc: "User journeys, features, and UI/UX guidelines" },
  { id: "test_improve", label: "5. Test and Improve", desc: "Plan for real user testing and feedback" },
  { id: "results_changes", label: "6. Results & Changes", desc: "Track results, failures, and required changes" },
  { id: "idea_breakdown", label: "7. Idea Breakdown", desc: "Break the idea into users, workflows and screens" },
  { id: "feature_prioritization", label: "8. Feature Prioritization", desc: "Decide what belongs in the first release" },
  { id: "tech_stack", label: "9. Tech Stack", desc: "Choose a maintainable stack for the product" },
  { id: "build_roadmap", label: "10. Build Roadmap", desc: "Plan the build in clear phases" },
];

export default function FounderProductPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const { activeVenture } = useActiveIdea();
  const [activeTab, setActiveTab] = useState(() => PRODUCT_TOOLS.some((tool) => tool.id === location.state?.autoSelectTool) ? location.state.autoSelectTool : "product_brief");
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
      {loading && (
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 py-20">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-8 w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}
      {!loading && (
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
            <div className="space-y-6 py-6" aria-label="Loading product deliverable" aria-busy="true">
              <Skeleton className="h-6 w-56" />
              <SkeletonText lines={2} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[0, 1, 2, 3].map((item) => <div key={item} className="space-y-3 rounded-xl bg-surface p-5"><Skeleton className="h-4 w-1/2" /><SkeletonText lines={4} /></div>)}
              </div>
            </div>
          )}

          {!loading && currentData && (
            <div className="space-y-8">
              {activeTab === "product_brief" && (
                <div className="space-y-8 text-sm">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Product Name</h4>
                    <p className="text-white font-display text-lg">{currentData.product_name}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Target Customer</h4>
                    <p className="text-white/80">{currentData.target_customer}</p>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">What Makes it Different</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.key_differentiators).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Core Features of the Idea</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.core_features).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "mvp_building" && (
                <div className="space-y-8 text-sm">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Generate a working prototype</h4>
                    <p className="text-white/80 whitespace-pre-wrap">{currentData.working_prototype_spec}</p>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Upload an MVP (Core MVP Features)</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.core_mvp_features).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "investor_summary" && (
                <div className="space-y-8 text-sm">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Headline</h4>
                    <p className="text-white font-display text-xl">{currentData.headline}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Problem Solved</h4>
                      <p className="text-white/80">{currentData.problem_solved}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Solution</h4>
                      <p className="text-white/80">{currentData.solution}</p>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Market Opportunity</h4>
                    <p className="text-white/80">{currentData.market_opportunity}</p>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Traction & Milestones</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.traction_or_milestones).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "design" && (
                <div className="space-y-8 text-sm">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">User Journeys</h4>
                    <ul className="space-y-4">
                      {safeList(currentData.user_journeys).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-white/[0.02] p-4 rounded-lg border border-white/5">
                          <span className="text-[#f2ca50] font-mono font-bold">{idx + 1}.</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Features</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.key_features).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">UI / UX</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.ui_ux_guidelines).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "test_improve" && (
                <div className="space-y-8 text-sm">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Testing Strategy</h4>
                    <p className="text-white/80 whitespace-pre-wrap">{currentData.testing_strategy}</p>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Target Tester Profiles</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.target_tester_profiles).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-2">Incentive Plan</h4>
                    <p className="text-white/80">{currentData.incentive_plan}</p>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Feedback Channels</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.feedback_channels).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "results_changes" && (
                <div className="space-y-8 text-sm">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Key Metrics to Track</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.key_metrics_to_track).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Expected Feedback Themes</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.expected_feedback_themes).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50] mb-4">Pivot or Persevere Criteria</h4>
                    <ul className="space-y-3">
                      {safeList(currentData.pivot_or_persevere_criteria).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-[#f2ca50] mt-0.5">•</span>
                          <span className="text-white/90">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {["idea_breakdown", "feature_prioritization", "tech_stack", "build_roadmap"].includes(activeTab) && currentData && (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-[#f2ca50]">{PRODUCT_TOOLS.find((tool) => tool.id === activeTab)?.label}</h3>
                  <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-white/80">{JSON.stringify(currentData, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}
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
