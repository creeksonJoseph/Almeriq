/**
 * components/ActiveIdeaDropdown.jsx - Global Active Idea Switcher Dropdown.
 *
 * Renders an active idea badge with an inverted 'v' (ChevronDown).
 * Clicking opens a sleek glassmorphic menu showing all saved ideas,
 * letting the founder switch context instantly or share a new idea.
 */
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lightbulb,
  ChevronDown,
  Check,
  Plus,
  BookOpen,
} from "lucide-react";
import { useActiveIdea } from "../context/IdeaContext";

export default function ActiveIdeaDropdown({ variant = "header", collapsed = false, className = "" }) {
  const { ventures, activeVenture, setActiveVentureId, clearActiveVenture } = useActiveIdea();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (id) => {
    setActiveVentureId(id);
    setOpen(false);
  };

  const handleCreateNew = () => {
    clearActiveVenture();
    setOpen(false);
    navigate("/founder/intake?mode=new");
  };

  // If user has zero saved ventures yet, show simple button to share one
  if (!ventures || ventures.length === 0) {
    if (variant === "sidebar") {
      if (collapsed) {
        return (
          <div className={`flex justify-center ${className}`}>
            <Link
              to="/founder/intake?mode=new"
              title="Share an Idea"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Plus size={15} />
            </Link>
          </div>
        );
      }

      return (
        <div className={`px-1 ${className}`}>
          <Link
            to="/founder/intake?mode=new"
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-xs font-medium text-white/60 hover:border-[#C9A15A]/40 hover:text-[#E8D6A8] hover:bg-[#C9A15A]/5 transition-all"
          >
            <Plus size={13} className="shrink-0 text-[#C9A15A]" />
            <span className="truncate font-medium">Share first venture</span>
          </Link>
        </div>
      );
    }

    return (
      <Link
        to="/founder/intake?mode=new"
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#f2ca50] hover:bg-[#f2ca50]/10 transition-colors shrink-0 ${className}`}
      >
        <span>+ Share Idea</span>
      </Link>
    );
  }

  const isSidebar = variant === "sidebar";

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* ── Trigger Button ── */}
      {isSidebar ? (
        collapsed ? (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={`group flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer border ${
              open
                ? "bg-white/[0.08] border-white/20 text-white"
                : "bg-white/[0.02] border-white/[0.08] text-white/70 hover:bg-white/[0.05] hover:border-white/15"
            }`}
            aria-expanded={open}
            aria-haspopup="true"
            title={`Active Venture: ${activeVenture?.idea || "Select venture"}`}
          >
            {activeVenture?.idea ? (
              <span className="font-semibold text-xs text-white/90">
                {activeVenture.idea.charAt(0).toUpperCase()}
              </span>
            ) : (
              <ChevronDown size={14} className="text-white/40" />
            )}
          </button>
        ) : (
          /* Subtle Border Idea Selector for Sidebar (No avatar, no green dot) */
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={`group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-all border cursor-pointer ${
              open
                ? "bg-white/[0.06] border-white/20 text-white shadow-sm"
                : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/15 text-white/90"
            }`}
            aria-expanded={open}
            aria-haspopup="true"
            title={`Active Venture: ${activeVenture?.idea || "Select venture"}`}
          >
            <span className="truncate text-xs font-medium text-white/85 group-hover:text-white">
              {activeVenture?.idea
                ? activeVenture.idea.slice(0, 24) + (activeVenture.idea.length > 24 ? "..." : "")
                : "Choose a venture"}
            </span>
            <ChevronDown
              size={13}
              className={`shrink-0 text-white/40 transition-transform duration-200 group-hover:text-white ${
                open ? "rotate-180 text-white" : ""
              }`}
            />
          </button>
        )
      ) : variant === "switcher" ? (
        /* Switcher Trigger with explicit label */
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
            open ? "text-[#c9a15a]" : "text-white/60 hover:text-white"
          }`}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span>Switch idea</span>
          <ChevronDown
            size={12}
            className={`shrink-0 text-white/40 transition-transform duration-200 ${
              open ? "rotate-180 text-[#c9a15a]" : ""
            }`}
          />
        </button>
      ) : (
        /* Header / Top Right Trigger - Clean borderless text and inverted 'v' chevron */
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors cursor-pointer min-w-0 max-w-[130px] sm:max-w-[200px] shrink hover:bg-white/5 ${
            open ? "text-[#f2ca50]" : "text-white/80 hover:text-white"
          }`}
          aria-expanded={open}
          aria-haspopup="true"
          title={`Current active idea: ${activeVenture?.idea || "Select idea"}`}
        >
          <span className="font-medium text-white/90 truncate text-xs min-w-0">
            {activeVenture?.idea
              ? activeVenture.idea.slice(0, 18) + (activeVenture.idea.length > 18 ? "..." : "")
              : "Select idea"}
          </span>
          {/* Inverted 'v' chevron */}
          <ChevronDown
            size={12}
            className={`shrink-0 text-white/40 transition-transform duration-200 ${
              open ? "rotate-180 text-[#f2ca50]" : ""
            }`}
          />
        </button>
      )}

      {/* ── Dropdown Popover Menu ── */}
      {open && (
        <div
          className={`absolute z-50 mt-1.5 rounded-xl border border-white/10 bg-[#14141c]/98 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            isSidebar
              ? collapsed
                ? "left-full top-0 ml-2 w-56"
                : "left-0 right-0 w-full"
              : "right-0 top-full w-60 sm:w-64 max-w-[calc(100vw-1.5rem)]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/8 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">
              Saved Ideas
            </span>
            <span className="text-[10px] text-white/40">
              {ventures.length} total
            </span>
          </div>

          {/* List of saved ideas - compact first few letters */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 py-1 custom-scrollbar">
            {ventures.map((v) => {
              const isSelected = activeVenture && String(activeVenture.id) === String(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelect(v.id)}
                  title={v.idea}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#f2ca50]/15 text-[#f2ca50] font-medium"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="truncate flex-1 font-medium">
                    {v.idea.slice(0, 24)}
                    {v.idea.length > 24 ? "..." : ""}
                  </span>

                  {isSelected && (
                    <Check size={13} className="shrink-0 text-[#f2ca50]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-1 pt-1.5 border-t border-white/8 flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-1 text-[11px] font-medium text-[#f2ca50] hover:text-white transition-colors py-1 px-1 rounded hover:bg-white/5 cursor-pointer"
            >
              <Plus size={12} />
              <span>New Idea</span>
            </button>
            <Link
              to="/founder/ventures"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors py-1 px-1 rounded hover:bg-white/5"
            >
              <BookOpen size={12} />
              <span>All Ideas</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
