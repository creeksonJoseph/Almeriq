/**
 * Pages/VenturesPage.jsx - Founder's saved AI-analysed venture history.
 *
 * Shows all previously analysed ventures as expandable cards.
 * Each card surfaces the brief + any analysis already run, plus
 * "Run analysis" buttons for analysis types not yet completed.
 */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { useVentures } from "../hooks/useVentures";
import { useFounderFlow } from "../hooks/useFounderFlow";
import { useConfirm } from "../context/ConfirmContext";

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
      <span className="inline-flex items-center rounded-lg bg-[#f2ca50]/10 border border-[#f2ca50]/25 px-3 py-1 text-xs font-semibold text-[#f2ca50]">
        ✓ {type.label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onRun}
      className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/45 hover:border-[#f2ca50]/40 hover:bg-[#f2ca50]/8 hover:text-[#f2ca50] transition-all"
    >
      Run {type.label}
    </button>
  );
}

// ── Single venture card ────────────────────────────────────────────────────

function VentureCard({ venture, onDelete, onRunAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirm = useConfirm();

  const analysesRun = venture.analyses_run || [];
  const isPending = venture.source === "pending";
  const hasAnyAnalysis = !isPending && (venture.summary || venture.market || venture.risks?.length);

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
    <article className="rounded-2xl border border-white/10 bg-[#12121a] transition-colors hover:border-white/15">
      {/* ── Header row — always visible ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-5 sm:p-6 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                label={venture.source === "gemini" ? "Gemini assisted" : "Starter analysis"}
                gold={venture.source === "gemini"}
                pending={isPending}
              />
              <span className="flex items-center gap-1 text-[10px] text-white/35">
                <Clock size={10} />
                {formatDate(venture.created_at)}
              </span>
              {analysesRun.length > 0 && (
                <span className="text-[10px] text-white/30">
                  {analysesRun.length}/4 analyses run
                </span>
              )}
            </div>
            <h2 className="font-display text-base font-semibold leading-snug text-white sm:text-lg line-clamp-2">
              {venture.idea}
            </h2>
            {hasAnyAnalysis ? (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">
                {venture.summary}
              </p>
            ) : (
              <p className="mt-2 text-sm text-white/35 italic">
                No AI analysis run yet — expand to choose an analysis type.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Users size={11} /> {venture.customer}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/40">
                <MapPin size={11} /> {venture.location}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete venture"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>
        </div>
      </button>

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="border-t border-white/8 px-5 pb-6 pt-5 sm:px-6">

          {/* Analysis type pills — shows what's been run + buttons for what hasn't */}
          <div className="mb-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              AI Analyses
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

          {/* Saved brief */}
          <details className="mb-6 group">
            <summary className="mb-3 flex cursor-pointer select-none items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40 hover:text-white/60">
              Startup brief
              <ChevronDown size={12} className="ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/8">
              <div className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Problem</p>
                <p className="text-sm leading-relaxed text-white/70">{venture.problem}</p>
              </div>
              <div className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">Solution</p>
                <p className="text-sm leading-relaxed text-white/70">{venture.solution}</p>
              </div>
            </div>
          </details>

          {/* Saved analysis data — only shown if venture has real analysis */}
          {hasAnyAnalysis && (
            <>
              {/* Market context */}
              {venture.market && (
                <div className="mb-6 border-l-2 border-[#f2ca50] pl-4 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2ca50] mb-1">
                    Market Context
                  </p>
                  <p className="text-sm leading-relaxed text-white/75">{venture.market}</p>
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
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
        Share a startup idea and get AI analysis. Every idea you explore is automatically saved here so you can check it anytime.
      </p>
      <Link
        to="/founder/intake"
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
  const navigate = useNavigate();

  // Load a saved venture back into the flow and navigate to analysis with a specific type pre-selected
  const handleRunAnalysis = (venture, toolKey) => {
    setForm({
      idea: venture.idea,
      problem: venture.problem,
      solution: venture.solution,
      customer: venture.customer,
      location: venture.location,
    });
    setVentureId(venture.id);
    // Pass the desired tool key via state so FounderAnalysisPage can auto-select it
    navigate("/founder/analysis", { state: { autoSelectTool: toolKey } });
  };

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-5xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white"
          >
            <ArrowLeft size={13} /> Dashboard
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">
                Founder Studio · Saved Ideas
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Saved Ideas
              </h1>
              <p className="mt-2 text-sm text-white/50">
                {ventures.length === 0
                  ? "Every AI analysis you run is saved here automatically."
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
                to="/founder/intake"
                className="alq-submit sm:w-auto sm:px-6"
              >
                New idea
              </Link>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

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
            <div className="space-y-4">
              {ventures.map((v) => (
                <VentureCard
                  key={v.id}
                  venture={v}
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
