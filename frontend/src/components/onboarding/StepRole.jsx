import React from "react";

const ROLES = [
  {
    id: "founder",
    title: "Founder / Entrepreneur",
    desc: "Building, scaling, and legalizing tech companies on Alimeriq",
    badge: "Building",
  },
  {
    id: "investor",
    title: "Investor / VC",
    desc: "Funding, evaluating, and backing high-growth ventures",
    badge: "Investing",
  },
  {
    id: "infrastructure",
    title: "Infrastructure Provider",
    desc: "Offering compute, legal, physical, or cloud resources",
    badge: "Providing",
  },
  {
    id: "job_seeker",
    title: "Talent / Job Seeker",
    desc: "Joining high-impact teams and early-stage companies",
    badge: "Talent",
  },
];

export default function StepRole({ role, setRole, loading, onBack, onSubmit }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-serif text-xl text-white font-medium tracking-tight">
          What is your primary goal?
        </h2>
        <p className="text-sm text-white/80 mt-2">
          Select your role so we can tailor your Alimeriq dashboard instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {ROLES.map((r) => {
          const isSelected = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center justify-between ${
                isSelected
                  ? "bg-[#181a22] ring-1 ring-[#f2ca50]"
                  : "bg-[#13141a] hover:bg-[#181a22] text-white"
              }`}
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">
                    {r.title}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/70 font-mono">
                    {r.badge}
                  </span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  {r.desc}
                </p>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-[#f2ca50] text-[#111318]" : "bg-[#22242c]"
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 bg-[#13141a] hover:bg-[#181a22] text-white/80 text-xs font-semibold rounded-full transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className={`min-w-0 flex-1 px-6 py-3 rounded-full text-xs font-bold uppercase transition-colors ${
            !loading
              ? "bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40]"
              : "bg-[#22242c] text-white/50 cursor-not-allowed"
          }`}
        >
          {loading ? "Completing Setup..." : "Complete Setup & Enter Dashboard"}
        </button>
      </div>
    </div>
  );
}
