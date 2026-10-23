import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function FounderStudioNav({ title, subtitle, action }) {
  const navigate = useNavigate();
  return (
    <div className="mb-8">
      {/* Top breadcrumb & back */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 transition-colors hover:text-white cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Header title & action */}
      {(title || action) && (
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {title && (
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#F3F1EC] sm:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-white leading-relaxed">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </div>
  );
}
