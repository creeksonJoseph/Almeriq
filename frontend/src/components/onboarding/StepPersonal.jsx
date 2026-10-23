import React, { useState, useMemo, useRef, useEffect } from "react";
import { COUNTRIES } from "../../lib/countries";
import { Search, X } from "lucide-react";

export default function StepPersonal({
  fullName,
  setFullName,
  nationality,
  setNationality,
  loading,
  onSubmit,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectedLabel =
    COUNTRIES.find((c) => c.name === nationality)?.name ?? nationality ?? "Select country";

  function pick(name) {
    setNationality(name);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-serif text-xl text-white font-medium tracking-tight">
          Personal Details
        </h2>
        <p className="text-sm text-white mt-2">
          Let&apos;s start by setting up your identity on Alimeriq.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="alq-label">Full Legal Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Grace Kiptum"
            className="alq-input"
          />
        </div>

        {/* ── Country picker with search ──────────────────────────────── */}
        <div ref={containerRef} className="relative">
          <label className="alq-label">Nationality / Primary Country</label>

          {/* Trigger button */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="alq-input text-left w-full flex items-center justify-between cursor-pointer"
          >
            <span className={nationality ? "text-white" : "text-white/40"}>
              {selectedLabel}
            </span>
            <svg
              className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-[#181a22] border border-white/10 shadow-xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                <Search size={14} className="text-white/40 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country…"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-white/40 hover:text-white/70"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Options list */}
              <ul
                role="listbox"
                className="max-h-52 overflow-y-auto py-1"
              >
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-xs text-white/40 text-center">
                    No countries found
                  </li>
                ) : (
                  filtered.map((c) => (
                    <li
                      key={c.code}
                      role="option"
                      aria-selected={nationality === c.name}
                      onClick={() => pick(c.name)}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                        nationality === c.name
                          ? "bg-[#f2ca50]/10 text-[#f2ca50] font-medium"
                          : "text-white/80 hover:bg-white/5"
                      }`}
                    >
                      {c.name}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase transition-colors ${
              !loading
                ? "bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40]"
                : "bg-[#22242c] text-white/50 cursor-not-allowed"
            }`}
          >
            {loading ? "Saving..." : "Continue to Verification"}
          </button>
        </div>
      </form>
    </div>
  );
}
