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
        <h2 className="font-serif text-xl text-white font-medium tracking-tight">
          Personal Details
        </h2>
        <p className="text-sm text-white/80 mt-2">
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

        <div>
          <label className="alq-label">Nationality / Primary Country</label>
          <select
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="alq-input text-white cursor-pointer"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name} className="bg-[#13141a] text-white">
                {c.name}
              </option>
            ))}
          </select>
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
