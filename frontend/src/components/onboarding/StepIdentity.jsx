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
        <h2 className="font-serif text-xl text-white font-medium tracking-tight">
          Identity Details
        </h2>
        <p className="text-sm text-white mt-2">
          Used for compliance-related workflows where required.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="alq-label">National ID Number / Passport Number</label>
          <input
            type="text"
            required
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="e.g. A123456789 or ID-99882"
            className="alq-input"
          />
        </div>

        <div className="p-4 rounded-xl bg-[#13141a] flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#f2ca50]/10 flex items-center justify-center shrink-0 text-[#f2ca50]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white mb-0.5">
              Why we ask for identity numbers
            </h4>
            <p className="text-xs text-white leading-relaxed">
              This information is collected for compliance workflows. Submitting it here does not verify your identity.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 bg-[#13141a] hover:bg-[#181a22] text-white text-xs font-semibold rounded-full transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase transition-colors ${
              !loading
                ? "bg-[#f2ca50] text-[#111318] hover:bg-[#e2ba40]"
                : "bg-[#22242c] text-white/50 cursor-not-allowed"
            }`}
          >
            {loading ? "Saving..." : "Continue to Role Selection"}
          </button>
        </div>
      </form>
    </div>
  );
}
