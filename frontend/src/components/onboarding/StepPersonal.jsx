import React from "react";
import { COUNTRIES } from "../../lib/countries";

export default function StepPersonal({
  fullName,
  setFullName,
  nationality,
  setNationality,
  loading,
  onSubmit,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
          Personal Details
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Let’s start by setting up your identity on Alimeriq.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Full Legal Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Eleanor Vance"
            className="alq-input"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Nationality / Primary Country
          </label>
          <select
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="alq-input text-white cursor-pointer bg-[#1C1C21]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name} className="bg-[#1C1C21] text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="alq-submit group w-full"
          >
            <span>{loading ? "Saving..." : "Continue to Verification"}</span>
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
