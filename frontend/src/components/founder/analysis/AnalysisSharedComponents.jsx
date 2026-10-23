import React from "react";

export function TagList({ items, colorClass = "bg-white/5 text-white border border-white/8" }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`rounded-md px-2.5 py-1 text-xs font-medium ${colorClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

export function NumberedList({ items, colorClass = "text-[#f2ca50]" }) {
  if (!items?.length) return null;
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-xs sm:text-sm text-white leading-relaxed">
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 bg-white/6 ${colorClass}`}>
            {i + 1}
          </span>
          <span>{typeof item === "object" ? JSON.stringify(item) : item}</span>
        </li>
      ))}
    </ol>
  );
}

export function ScoreBadge({ score, max = 10 }) {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? "text-[#f2ca50]" : pct >= 50 ? "text-white" : "text-white/60";
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-3xl sm:text-4xl font-bold tabular-nums font-display ${color}`}>
        {score}
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-white/40">/{max}</span>
    </div>
  );
}
