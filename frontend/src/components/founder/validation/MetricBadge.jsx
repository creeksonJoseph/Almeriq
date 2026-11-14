import React from "react";

export default function MetricBadge({ rating }) {
  const r = (rating || "").toLowerCase();
  if (r === "strong") {
    return (
      <span className="inline-flex items-center rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
        Strong
      </span>
    );
  }
  if (r === "vague") {
    return (
      <span className="inline-flex items-center rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
        Vague
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
      Weak
    </span>
  );
}