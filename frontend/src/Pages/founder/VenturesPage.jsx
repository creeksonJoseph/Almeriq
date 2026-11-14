/**
 * Pages/VenturesPage.jsx - Founder's saved AI-analysed venture history.
 *
 * Shows all previously analysed ventures as expandable cards.
 * Each card surfaces the brief + any analysis already run, plus
 * "Run analysis" buttons for analysis types not yet completed.
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import { FounderFlowGuard } from "../../components/founder/FounderFlowLayout";
import { useVentures } from "../../hooks/useVentures";
import { useFounderFlow } from "../../hooks/useFounderFlow";
import { useConfirm } from "../../context/ConfirmContext";
import { useActiveIdea } from "../../context/IdeaContext";
import { useToast } from "../../context/ToastContext";

// ── Analysis type metadata (mirrors FounderAnalysisPage) ─────────────────────

const ANALYSIS_TYPES = [
  { key: "market_analysis", label: "Market Analysis" },
  { key: "feasibility_analysis", label: "Feasibility Check" },
  { key: "business_plan", label: "Business Plan" },
  { key: "execution_roadmap", label: "Execution Roadmap" },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function Badge({ label, gold, pending }) {
  if (pending) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-white/6 text-white/40 border border-white/10">
        Brief saved
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        gold
          ? "bg-[#f2ca50]/15 text-[#f2ca50]"
          : "bg-white/6 text-white/50"
      }`}
    >
      {label}
    </span>
  );
}

function ListSection({ title, items, accentClass }) {
  if (!items?.length) return null;
  return (
    <section>
      <div className={`mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] ${accentClass}`}>
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-white/65">
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${accentClass === "text-[#f2ca50]" ? "bg-[#f2ca50]/15 text-[#f2ca50]" : "bg-white/8 text-white/50"}`}>
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Analysis type pill — run or not ──────────────────────────────────────────

function AnalysisTypePill({ type, isRun, onRun }) {
  if (isRun) {
    return (
      <button
        type="button"
        onClick={onRun}
        title={`View analyzed ${type.label}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#f2ca50]/10 border border-[#f2ca50]/30 px-3 py-1 text-xs font-semibold text-[#f2ca50] hover:bg-[#f2ca50]/20 hover:border-[#f2ca50]/50 transition-all cursor-pointer group"
      >
        <Check size={12} className="stroke-[2.5]" />
        <span>{type.label}</span>
        <span className="text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">· View</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onRun}
      title={`Run ${type.label}`}
      className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/50 hover:border-[#f2ca50]/40 hover:bg-[#f2ca50]/8 hover:text-[#f2ca50] transition-all cursor-pointer"
    >
      Run {type.label}
    </button>
  );
}

// ── Single venture card ────────────────────────────────────────────────────

function VentureCard({ venture, isActive, onSetActive, onDelete, onRunAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirm = useConfirm();

  const analysesRun = venture.analyses_run || [];
  const isPending = venture.source === "pending" && analysesRun.length === 0;
  const hasCompletedAnalyses = analysesRun.length > 0;
  const summaryText = venture.summary?.trim() || "";
  const hasAnyAnalysis = Boolean(summaryText || venture.market || venture.risks?.length || hasCompletedAnalyses);

  const handleDelete = async (e) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Delete this idea?",
      message: "Are you sure you want to delete this startup idea? All generated analysis and plans for this idea will be removed permanently.",
      confirmText: "Delete Idea",
      cancelText: "Keep Idea",
      danger: true,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(venture.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article
      className={`transition-all py-6 border-b ${
        isActive
          ? "border-[#f2ca50]/50"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      {/* ── Header row — always visible ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-0 pb-2"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {isActive && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#f2ca50] border border-[#f2ca50]/40">
                  <span className="h-1 w-1 rounded-full bg-[#f2ca50]" />
                  Active Idea
                </span>
              )}
              <Badge
                label={hasCompletedAnalyses ? "Analyzed" : "Starter brief"}
                gold={hasCompletedAnalyses}
                pending={isPending}
              />
              <span className="flex items-center gap-1 text-[10px] text-white/35">
                <Clock size={10} />
                {formatDate(venture.created_at)}
              </span>
              {hasCompletedAnalyses && (
                <span className="text-[10px] text-white/30">
                  {analysesRun.length}/4 analyses run
                </span>
              )}
            </div>
            <h2 className="font-display text-xl font-semibold leading-snug text-white">
              {venture.name || venture.idea}
            </h2>
            {venture.name && venture.idea && (
              <p className="mt-2 text-sm text-white/80 font-medium line-clamp-2">
                {venture.idea}
              </p>
            )}
            {summaryText ? (
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white">
                {summaryText}
              </p>
            ) : hasCompletedAnalyses ? (
              <p className="mt-3 text-sm text-[#f2ca50]">
                {analysesRun.length} of 4 analysis module{analysesRun.length !== 1 ? "s" : ""} completed · Click to view results or run additional modules.
              </p>
            ) : (
              <p className="mt-3 text-sm text-white/70 italic">
                No analysis run yet — expand to choose an analysis type.
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1.5 text-xs text-white">
                <Users size={12} /> {venture.customer}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white">
                <MapPin size={12} /> {venture.location}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/founder/intake?mode=edit&id=${venture.id}`}
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/40 hover:text-white transition-all cursor-pointer"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete venture"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 transition-colors hover:text-red-300 disabled:opacity-40"
            >
              <Trash2 size={16} />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          </div>
        </div>
      </button>

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="pt-6 pb-2">

          {/* Analysis type pills — shows what's been run + buttons for what hasn't */}
          <div className="mb-6">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Available Analyses
            </p>
            <div className="flex flex-wrap gap-2">
              {ANALYSIS_TYPES.map((type) => (
                <AnalysisTypePill
                  key={type.key}
                  type={type}
                  isRun={analysesRun.includes(type.key)}
                  onRun={() => onRunAnalysis(venture, type.key)}
                />
              ))}
            </div>
          </div>

          {/* Startup brief specification — clean unboxed presentation */}
          <div className="mb-6">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Startup Brief
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/60">The Problem</p>
                  <p className="text-sm leading-relaxed text-white">{venture.problem || "No problem statement recorded."}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/60">Target Customer</p>
                  <p className="text-sm leading-relaxed text-white">{venture.customer || "General market / Not specified"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">Proposed Solution</p>
                  <p className="text-sm leading-relaxed text-white">{venture.solution || "No solution details recorded."}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">Launch Market</p>
                  <p className="text-sm leading-relaxed text-white capitalize">{venture.location || "Not specified"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Saved analysis data — only shown if venture has real analysis */}
          {hasAnyAnalysis && (
            <>
              {/* Market context */}
              {venture.market && (
                <div className="mb-6 border-l-2 border-[#f2ca50] pl-4 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2ca50] mb-1">
                    Market Context
                  </p>
                  <p className="text-sm leading-relaxed text-white">{venture.market}</p>
                </div>
              )}

              {/* Analysis list sections */}
              <div className="grid gap-6 sm:grid-cols-2">
                <ListSection title="Risks to test" items={venture.risks} accentClass="text-red-300/70" />
                <ListSection title="Focused MVP" items={venture.mvp} accentClass="text-[#f2ca50]" />
                <ListSection title="Roadmap" items={venture.roadmap} accentClass="text-[#f2ca50]" />
                <ListSection title="Next steps" items={venture.next_steps} accentClass="text-white/70" />
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyVentures() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/2 px-6 text-center">
      <Bot size={28} className="text-[#f2ca50]" />
      <h2 className="mt-4 font-display text-xl font-semibold text-white">
        No ideas saved yet
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white">
        Share a startup idea and get full analysis. Every idea you explore is automatically saved here so you can check it anytime.
      </p>
      <Link
        to="/founder/intake?mode=new"
        className="alq-submit mt-6 sm:mx-auto sm:w-auto sm:px-8"
      >
        Share your first startup idea
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VenturesPage() {
  const { ventures, loading, error, refresh, remove } = useVentures();
  const { setForm, setVentureId } = useFounderFlow();
  const { activeVentureId, setActiveVentureId } = useActiveIdea();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Show disappearing toast on load/refresh error rather than stuck inline banner
  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error, showToast]);

  // Load a saved venture back into the flow and navigate to analysis with autoRun
  const handleRunAnalysis = (venture, toolKey) => {
    setActiveVentureId(venture.id);
    setForm({
      idea: venture.idea,
      problem: venture.problem,
      solution: venture.solution,
      customer: venture.customer,
      location: venture.location,
    });
    setVentureId(venture.id);
    // Pass autoSelectTool and autoRun so FounderAnalysisPage immediately displays the cached result or runs it
    navigate("/founder/analysis", {
      state: {
        autoSelectTool: toolKey,
        autoRun: true,
      },
    });
  };

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 lg:px-8 pb-14 pt-4 sm:pt-6">
        {/* Page header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Saved Ideas
              </h1>
              <p className="mt-2 text-sm text-white">
                {ventures.length === 0
                  ? "Every analysis you run is saved here automatically."
                  : `${ventures.length} idea${ventures.length !== 1 ? "s" : ""} saved`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
              >
                <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <Link
                to="/founder/intake?mode=new"
                className="alq-submit sm:w-auto sm:px-6"
              >
                New idea
              </Link>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && ventures.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/4" />
            ))}
          </div>
        )}

        {/* Venture list */}
        {!loading || ventures.length > 0 ? (
          ventures.length === 0 ? (
            <EmptyVentures />
          ) : (
            <div className="divide-y divide-white/10 sm:divide-y-0 sm:space-y-4">
              {ventures.map((v) => (
                <VentureCard
                  key={v.id}
                  venture={v}
                  isActive={activeVentureId === v.id}
                  onSetActive={() => setActiveVentureId(v.id)}
                  onDelete={remove}
                  onRunAnalysis={handleRunAnalysis}
                />
              ))}
            </div>
          )
        ) : null}
      </div>
    </FounderFlowGuard>
  );
}
