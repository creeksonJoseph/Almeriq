import React from "react";

export default function StepIdentity({
  idNumber,
  setIdNumber,
  loading,
  onBack,
  onSubmit,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
          Identity Verification
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Required for legal company registration and compliance.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            National ID Number / Passport Number
          </label>
          <input
            type="text"
            required
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="e.g. A123456789 or ID-99882"
            className="alq-input"
          />
        </div>

        {/* UX Helper Box */}
        <div className="p-4 rounded-2xl bg-[#16161F] border border-white/10 flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#C9A15A]/10 border border-[#C9A15A]/20 flex items-center justify-center shrink-0 text-[#C9A15A]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white mb-0.5">
              Why we ask for identity numbers
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Required for legal company registration, compliance, and regulatory verification when executing infrastructure or investment contracts.
            </p>
          </div>
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
            type="submit"
            disabled={loading}
            className="alq-submit group flex-1"
          >
            <span>{loading ? "Verifying..." : "Proceed to Role Selection"}</span>
            <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
