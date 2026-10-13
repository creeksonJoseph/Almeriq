import React, { useState, useEffect } from "react";
import {
  Send,
  Mail,
  Briefcase,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
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
          title="Outreach & Team Communications"
          subtitle="Generate investor updates and founding team job descriptions tailored to your current milestone."
        />

        {/* Tab Controls */}
        <div className="mb-8 grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("investor_update")}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
              activeTab === "investor_update"
                ? "border-[#C9A15A] bg-[#C9A15A]/15 text-[#E8D6A8] shadow-sm"
                : "border-[#2B2B31] bg-[#141417] text-[#9B9A94] hover:text-white"
            }`}
          >
            <Mail size={16} />
            <span>Monthly Investor Update</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("job_post")}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
              activeTab === "job_post"
                ? "border-[#C9A15A] bg-[#C9A15A]/15 text-[#E8D6A8] shadow-sm"
                : "border-[#2B2B31] bg-[#141417] text-[#9B9A94] hover:text-white"
            }`}
          >
            <Briefcase size={16} />
            <span>Founding Job Posting</span>
          </button>
        </div>

        {/* Container */}
        <div className="rounded-2xl border border-[#2B2B31] bg-[#141417] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#2B2B31] pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-[#F3F1EC]">
                {activeTab === "investor_update" ? "Investor Newsletter & KPI Memo" : "Founding Engineer Job Description"}
              </h3>
              <p className="text-xs text-[#9B9A94]">
                {activeTab === "investor_update"
                  ? "Standard monthly template with highlights, lowlights, key metrics, and specific asks."
                  : "Compelling talent pitch highlighting equity, mission, and technical ownership."}
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
              <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-4">
                <span className="text-[10px] uppercase tracking-wider text-[#5F5E5A]">Email Subject</span>
                <p className="mt-1 font-mono text-xs font-semibold text-[#F3F1EC]">{current.subject}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <span className="text-xs font-semibold uppercase text-emerald-400">Highlights</span>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[#F3F1EC]">
                    {current.highlights?.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <span className="text-xs font-semibold uppercase text-rose-400">Lowlights & Learnings</span>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[#F3F1EC]">
                    {current.lowlights?.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-4">
                  <span className="text-xs font-semibold uppercase text-[#C9A15A]">Key Metrics</span>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[#F3F1EC]">
                    {current.kpis?.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-4">
                  <span className="text-xs font-semibold uppercase text-blue-400">Asks from Backers</span>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[#F3F1EC]">
                    {current.asks?.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[#2B2B31] bg-[#0A0A0B] p-5">
                <div className="flex items-center justify-between border-b border-[#2B2B31] pb-3">
                  <span className="text-xs font-semibold text-[#E8D6A8]">Complete Ready-to-Send Email</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(current.full_email)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#C9A15A] hover:underline"
                  >
                    {copied ? <Check size={14} className="text-[#3E8368]" /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy Full Body"}</span>
                  </button>
                </div>
                <pre className="mt-4 max-h-64 overflow-y-auto font-mono text-xs leading-relaxed text-[#9B9A94] whitespace-pre-wrap">
                  {current.full_email}
                </pre>
              </div>
            </div>
          )}

          {!loading && current && activeTab === "job_post" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
                <div>
                  <span className="text-[10px] uppercase text-[#C9A15A]">Position Title</span>
                  <h4 className="mt-1 font-display text-lg font-bold text-[#F3F1EC]">{current.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      `${current.title}\n\n${current.role_summary}\n\nResponsibilities:\n${current.responsibilities?.join("\n")}\n\nRequirements:\n${current.requirements?.join("\n")}\n\nWhy Join Us:\n${current.why_join_us}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2B2B31] bg-[#141417] px-3 py-1.5 text-xs font-semibold text-[#E8D6A8] hover:bg-white/5"
                >
                  {copied ? <Check size={14} className="text-[#3E8368]" /> : <Copy size={14} />}
                  <span>{copied ? "Copied Job Post" : "Copy All"}</span>
                </button>
              </div>

              <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
                <span className="text-xs font-semibold text-[#C9A15A]">Role Summary</span>
                <p className="mt-2 text-xs leading-relaxed text-[#F3F1EC]">{current.role_summary}</p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
                  <span className="text-xs font-semibold text-[#F3F1EC]">Core Responsibilities</span>
                  <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-[#9B9A94]">
                    {current.responsibilities?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-[#2B2B31] bg-[#1C1C21]/60 p-5">
                  <span className="text-xs font-semibold text-[#F3F1EC]">Required Experience</span>
                  <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-[#9B9A94]">
                    {current.requirements?.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[#C9A15A]/30 bg-[#C9A15A]/10 p-5">
                <span className="text-xs font-semibold text-[#E8D6A8]">Why Join Us (The Pitch)</span>
                <p className="mt-2 text-xs leading-relaxed text-[#F3F1EC]">{current.why_join_us}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </FounderFlowGuard>
  );
}
