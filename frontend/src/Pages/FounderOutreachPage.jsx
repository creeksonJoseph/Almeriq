import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { listVenturesApi, executeAiToolApi } from "../lib/api";
import { useToast } from "../context/ToastContext";

export default function FounderOutreachPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("investor_update"); // "investor_update" | "job_post"
  const [brief, setBrief] = useState({ idea: "", customer: "", location: "" });
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
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
    load();
  }, []);

  const fetchOutreach = async (refresh = false) => {
    setLoading(true);
    try {
      const res = await executeAiToolApi({
        tool_key: activeTab,
        idea: brief.idea || "Fast-growing venture platform",
        customer: brief.customer,
        location: brief.location,
        extra_params: refresh ? { refresh: true } : {},
      });
      setData((prev) => ({
        ...prev,
        [activeTab]: res.result,
      }));
      if (refresh) {
        showToast("Template regenerated successfully", "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to generate outreach template", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data[activeTab]) {
      fetchOutreach(false);
    }
  }, [activeTab, brief.idea]);

  const current = data[activeTab];

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Updates & Team"
          subtitle="Write quick monthly progress updates or create a post to find teammates."
        />

        {/* Tab Controls - Clean Text Tabs */}
        <div className="mb-8 flex gap-2 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("investor_update")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "investor_update"
                ? "bg-[#f2ca50]/15 text-[#f2ca50] border border-[#f2ca50]/30"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Monthly Progress Update
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("job_post")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "job_post"
                ? "bg-[#f2ca50]/15 text-[#f2ca50] border border-[#f2ca50]/30"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Find a Teammate / Job Post
          </button>
        </div>

        {/* Container */}
        <div className="rounded-2xl border border-[#2B2B31] bg-[#141417] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#2B2B31] pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-[#F3F1EC]">
                {activeTab === "investor_update" ? "Monthly Progress Update" : "Teammate Role Description"}
              </h3>
              <p className="text-xs text-[#9B9A94]">
                {activeTab === "investor_update"
                  ? "A simple update to share your milestones, numbers, and what help you need."
                  : "A clear post explaining your project's mission and what skills you are looking for."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchOutreach(true)}
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
                Drafting communication with founder narrative...
              </p>
            </div>
          )}

          {!loading && current && activeTab === "investor_update" && (
            <div className="space-y-6">
              {/* Subject Strip & Copy Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Email Subject</span>
                  <p className="mt-1 font-mono text-xs sm:text-sm font-semibold text-white truncate">{current.subject}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(current.full_email)}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-[#f2ca50]/30 bg-[#f2ca50]/10 px-3.5 py-1.5 text-xs font-semibold text-[#f2ca50] hover:bg-[#f2ca50]/20 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? "Copied Full Email" : "Copy Ready Email"}</span>
                </button>
              </div>

              {/* Highlights & Lowlights - 2-Column Document Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="border-l-2 border-[#f2ca50] pl-4 py-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f2ca50] block mb-2">Highlights & Wins</span>
                  <ul className="space-y-1.5 text-xs text-white/80">
                    {safeList(current.highlights).map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#f2ca50] font-bold">·</span>
                        <span>{typeof h === "object" ? JSON.stringify(h) : String(h)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-l-2 border-white/20 pl-4 py-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60 block mb-2">Lowlights & Learnings</span>
                  <ul className="space-y-1.5 text-xs text-white/70">
                    {safeList(current.lowlights).map((l, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-white/40 font-bold">·</span>
                        <span>{typeof l === "object" ? JSON.stringify(l) : String(l)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Metrics & The Ask */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-2">Key Metric Pulse</span>
                  <ul className="space-y-1.5 text-xs text-white/80">
                    {safeList(current.kpis).map((k, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#f2ca50] font-bold">·</span>
                        <span>{typeof k === "object" ? JSON.stringify(k) : String(k)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f2ca50] block mb-2">Asks from Backers</span>
                  <ul className="space-y-1.5 text-xs text-white/80">
                    {safeList(current.asks).map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#f2ca50] font-bold">·</span>
                        <span>{typeof a === "object" ? JSON.stringify(a) : String(a)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Full Email Editor / Preview Box */}
              <div className="pt-4 border-t border-white/8">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                  Complete Ready-to-Send Text
                </span>
                <pre className="p-5 rounded-xl border border-white/10 bg-white/[0.01] font-mono text-xs leading-relaxed text-white/80 whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {current.full_email}
                </pre>
              </div>
            </div>
          )}

          {!loading && current && activeTab === "job_post" && (
            <div className="space-y-6">
              {/* Header Title & Copy */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">Role Opening</span>
                  <h4 className="mt-1 font-display text-xl font-bold text-white">{current.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      `${current.title}\n\n${current.role_summary}\n\nResponsibilities:\n${current.responsibilities?.join("\n")}\n\nRequirements:\n${current.requirements?.join("\n")}\n\nWhy Join Us:\n${current.why_join_us}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-[#f2ca50]/30 bg-[#f2ca50]/10 px-3.5 py-1.5 text-xs font-semibold text-[#f2ca50] hover:bg-[#f2ca50]/20 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? "Copied Job Post" : "Copy Job Post"}</span>
                </button>
              </div>

              {/* Role Summary */}
              <div className="py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Role Summary</span>
                <p className="text-sm leading-relaxed text-white/80">{current.role_summary}</p>
              </div>

              {/* Responsibilities & Requirements Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60 block mb-2">Core Responsibilities</span>
                  <ul className="space-y-1.5 text-xs text-white/80">
                    {safeList(current.responsibilities).map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#f2ca50] font-bold">·</span>
                        <span>{typeof r === "object" ? JSON.stringify(r) : String(r)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60 block mb-2">Required Skills & Experience</span>
                  <ul className="space-y-1.5 text-xs text-white/80">
                    {safeList(current.requirements).map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#f2ca50] font-bold">·</span>
                        <span>{typeof req === "object" ? JSON.stringify(req) : String(req)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* The Pitch */}
              {current.why_join_us && (
                <div className="border-l-2 border-[#f2ca50] pl-4 py-2 bg-gradient-to-r from-[#f2ca50]/5 to-transparent">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">Why Join Us (The Pitch)</span>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/80 italic">
                    "{current.why_join_us}"
                  </p>
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

