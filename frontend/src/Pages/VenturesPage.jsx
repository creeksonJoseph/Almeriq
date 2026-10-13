/**
 * Pages/VenturesPage.jsx - Founder's saved AI-analysed venture history.
 *
 * Shows all previously analysed ventures as expandable cards.
 * Each card surfaces the brief summary and lets the founder expand
 * to see the full analysis (risks, MVP, roadmap, next steps).
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import FounderFlowLayout from "../components/founder/FounderFlowLayout";
import { useVentures } from "../hooks/useVentures";

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

function Badge({ label, gold }) {
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

function ListSection({ title, items, icon: Icon, accentClass }) {
  return (
    <section>
      <div className={`mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] ${accentClass}`}>
        <Icon size={13} />
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

// ── Single venture card ────────────────────────────────────────────────────

function VentureCard({ venture, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this venture analysis? This cannot be undone.")) return;
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
              <Badge label={venture.source === "gemini" ? "Gemini assisted" : "Starter analysis"} gold={venture.source === "gemini"} />
              <span className="flex items-center gap-1 text-[10px] text-white/35">
                <Clock size={10} />
                {formatDate(venture.created_at)}
              </span>
            </div>
            <h2 className="font-display text-base font-semibold leading-snug text-white sm:text-lg line-clamp-2">
              {venture.idea}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">
              {venture.summary}
            </p>
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

      {/* ── Expanded analysis ── */}
      {expanded && (
        <div className="border-t border-white/8 px-5 pb-6 pt-5 sm:px-6">
          {/* Market context */}
          <div className="mb-6 rounded-xl border border-[#f2ca50]/20 bg-[#f2ca50]/5 p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2ca50]">
              Market context
            </p>
            <p className="text-sm leading-relaxed text-white/65">{venture.market}</p>
          </div>

          {/* Brief inputs */}
          <details className="mb-6 group">
            <summary className="mb-3 flex cursor-pointer select-none items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40 hover:text-white/60">
              <Bot size={13} />
              Original brief
              <ChevronDown size={12} className="ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Problem", venture.problem],
                ["Solution", venture.solution],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl bg-white/3 p-3.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">{label}</p>
                  <p className="text-sm leading-relaxed text-white/65">{val}</p>
                </div>
              ))}
            </div>
          </details>

          {/* Analysis sections */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <ListSection title="Risks to test" items={venture.risks} icon={Target} accentClass="text-red-300/70" />
            <ListSection title="Focused MVP" items={venture.mvp} icon={Sparkles} accentClass="text-[#f2ca50]" />
            <ListSection title="Roadmap" items={venture.roadmap} icon={RotateCcw} accentClass="text-emerald-400/80" />
            <ListSection title="Next steps" items={venture.next_steps} icon={Target} accentClass="text-blue-300/70" />
          </div>

          {/* Re-analyse CTA */}
          <div className="mt-6 flex justify-end">
            <Link
              to="/founder/intake"
              className="inline-flex items-center gap-2 rounded-full bg-white/6 px-4 py-2 text-xs font-semibold text-white/65 hover:bg-white/10 hover:text-white"
            >
              <Bot size={13} /> Analyse a new idea
            </Link>
          </div>
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
        No ventures analysed yet
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
        Complete a venture brief and receive an AI-powered analysis. Every analysis
        is automatically saved here so you can revisit and compare your ideas.
      </p>
      <Link
        to="/founder/intake"
        className="alq-submit mt-6 sm:mx-auto sm:w-auto sm:px-8"
      >
        Start your first venture brief
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VenturesPage() {
  const { ventures, loading, error, refresh, remove } = useVentures();

  return (
    <FounderFlowLayout>
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
              Founder studio · Venture history
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Explored Ventures
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {ventures.length === 0
                ? "Every AI analysis you run is saved here automatically."
                : `${ventures.length} venture${ventures.length !== 1 ? "s" : ""} analysed`}
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
              <Bot size={14} /> New analysis
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
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-white/4"
            />
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
              <VentureCard key={v.id} venture={v} onDelete={remove} />
            ))}
          </div>
        )
      ) : null}
    </FounderFlowLayout>
  );
}
