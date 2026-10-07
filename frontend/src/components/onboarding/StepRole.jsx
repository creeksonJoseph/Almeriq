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

export default function StepRole({
  role,
  setRole,
  loading,
  onBack,
  onSubmit,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
          What is your primary goal?
        </h2>
        <p className="text-sm text-white mt-1">
          Select your role so we can tailor your Alimeriq dashboard instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ROLES.map((r) => {
          const isSelected = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between ${
                isSelected
                  ? "bg-[#C9A15A]/10 border-[#C9A15A] shadow-[0_0_20px_rgba(201,161,90,0.15)]"
                  : "bg-[#14141B] border-white/5 hover:border-white/20"
              }`}
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{r.title}</span>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white font-mono">
                    {r.badge}
                  </span>
                </div>
                <p className="text-xs text-white leading-relaxed">{r.desc}</p>
              </div>

              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? "border-[#C9A15A] bg-[#C9A15A] text-black" : "border-white/20"
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 bg-[#1C1C24] hover:bg-[#252530] text-gray-300 text-xs font-semibold rounded-xl border border-white/5 transition-all"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="alq-submit group flex-1"
        >
          <span>{loading ? "Completing Setup..." : "Complete Setup & Enter Dashboard"}</span>
          <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
