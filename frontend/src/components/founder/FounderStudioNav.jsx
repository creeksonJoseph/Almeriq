import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Cpu,
  Boxes,
  Scale,
  Send,
  ArrowLeft,
} from "lucide-react";

export const FOUNDER_STUDIO_TABS = [
  { path: "/founder", label: "Studio Hub", icon: Compass },
  { path: "/founder/intake", label: "Venture Brief", icon: Lightbulb },
  { path: "/founder/ventures", label: "Explored Ventures", icon: BookOpen },
  { path: "/founder/validation", label: "Idea Validation", icon: CheckCircle2 },
  { path: "/founder/ai-tools", label: "AI Business Builder", icon: Cpu },
  { path: "/founder/product", label: "Product Dev", icon: Boxes },
  { path: "/founder/legal", label: "Legal & Filings", icon: Scale },
  { path: "/founder/outreach", label: "Outreach & Hiring", icon: Send },
];

export default function FounderStudioNav({ title, subtitle, action }) {
  const location = useLocation();

  return (
    <div className="mb-8">
      {/* Top breadcrumb & back */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A15A]">
          Founder Studio Suite
        </span>
      </div>

      {/* Header title & action */}
      {(title || action) && (
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {title && (
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#F3F1EC] sm:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-[#9B9A94]">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Scrollable navigation tabs */}
      <div className="no-scrollbar -mx-4 flex overflow-x-auto border-b border-[#2B2B31] px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5 pb-2">
          {FOUNDER_STUDIO_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  active
                    ? "bg-[#C9A15A]/15 text-[#E8D6A8] border border-[#C9A15A]/30 shadow-sm"
                    : "text-[#9B9A94] hover:bg-[#1C1C21] hover:text-[#F3F1EC]"
                }`}
              >
                <Icon
                  size={15}
                  className={active ? "text-[#C9A15A]" : "text-[#5F5E5A]"}
                />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
