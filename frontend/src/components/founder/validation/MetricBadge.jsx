import React from "react";

export default function MetricBadge({ rating }) {
  const r = (rating || "").toLowerCase();
  if (r === "strong") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
        Strong
      </span>
    );
  }
  if (r === "vague") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
        Vague
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
      Weak
    </span>
  );
}
