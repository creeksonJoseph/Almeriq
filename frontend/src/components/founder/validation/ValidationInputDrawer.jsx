import React from "react";

export default function ValidationInputDrawer({
  ideaInput,
  setIdeaInput,
  problemInput,
  setProblemInput,
  solutionInput,
  setSolutionInput,
  customerInput,
  setCustomerInput,
  locationInput,
  setLocationInput,
  onCancel,
  onSubmit,
  evaluating,
}) {
  return (
    <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
      <div>
        <label className="text-xs font-semibold text-white block mb-1.5">
          Startup Idea / Headline *
        </label>
        <input
          type="text"
          value={ideaInput}
          onChange={(e) => setIdeaInput(e.target.value)}
          placeholder="e.g. B2B inventory reconciliation platform for mid-market logistics"
          className="alq-input w-full text-sm py-3 px-4"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-white block mb-1.5">
          Problem Statement
        </label>
        <textarea
          rows={3}
          value={problemInput}
          onChange={(e) => setProblemInput(e.target.value)}
          placeholder="What is the acute pain, friction, or cost experienced by users?"
          className="alq-input w-full min-h-28 text-sm py-3 px-4 resize-y leading-relaxed"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-white block mb-1.5">
          Proposed Solution
        </label>
        <textarea
          rows={3}
          value={solutionInput}
          onChange={(e) => setSolutionInput(e.target.value)}
          placeholder="How does your product directly and uniquely solve this problem?"
          className="alq-input w-full min-h-28 text-sm py-3 px-4 resize-y leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-white block mb-1.5">
            Target Customer
          </label>
          <input
            type="text"
            value={customerInput}
            onChange={(e) => setCustomerInput(e.target.value)}
            placeholder="e.g. Warehouse managers & 3PL operators"
            className="alq-input w-full text-sm py-2.5 px-4"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-white block mb-1.5">
            Market Location / Geography
          </label>
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="e.g. North America / Kenya / Global"
            className="alq-input w-full text-sm py-2.5 px-4"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={evaluating}
          className="alq-submit text-xs sm:text-sm px-6 py-2.5"
        >
          {evaluating ? "Evaluating..." : "Save & Evaluate"}
        </button>
      </div>
    </div>
  );
}
