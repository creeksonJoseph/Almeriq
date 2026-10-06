import React, { useState } from "react";
import { COUNTRIES } from "../lib/countries";
import { onboardingApi } from "../lib/api";

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

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [nationality, setNationality] = useState(user?.nationality || "United States");
  const [idNumber, setIdNumber] = useState(user?.id_number || "");
  const [role, setRole] = useState(user?.role !== "user" ? user?.role : "founder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNextStep1 = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onboardingApi({ full_name: fullName, nationality });
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to save personal details.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep2 = async (e) => {
    e.preventDefault();
    if (!idNumber.trim()) {
      setError("Please enter your ID or Passport number for verification.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onboardingApi({ id_number: idNumber });
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to save identity verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await onboardingApi({
        full_name: fullName,
        nationality,
        id_number: idNumber,
        role,
      });
      if (onComplete) {
        onComplete(res.user);
      }
    } catch (err) {
      setError(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-2xl overflow-y-auto">
      {/* Outer Shell - Double Bezel Architecture */}
      <div className="w-full max-w-xl mx-auto bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-2 md:p-3 my-auto shadow-2xl transition-all duration-500">
        
        {/* Inner Core */}
        <div className="bg-[#0D0D14] rounded-[calc(2.5rem-0.5rem)] border border-white/5 p-6 md:p-10 relative overflow-hidden">
          
          {/* Ambient Corner Glow */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#C9A15A]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Wizard Header & Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-[#C9A15A]/10 border border-[#C9A15A]/20 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C9A15A]">
                Phase 2 • Step {step} of 3
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {step === 1 && "Personal Info"}
                {step === 2 && "Identity Verification"}
                {step === 3 && "Role & Intent"}
              </span>
            </div>

            {/* Step Progress Bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1 p-0.5 border border-white/5">
              <div className={`h-full rounded-full transition-all duration-500 ${step >= 1 ? "bg-[#C9A15A] w-1/3" : "bg-transparent"}`} />
              <div className={`h-full rounded-full transition-all duration-500 ${step >= 2 ? "bg-[#C9A15A] w-1/3" : "bg-transparent"}`} />
              <div className={`h-full rounded-full transition-all duration-500 ${step >= 3 ? "bg-[#C9A15A] w-1/3" : "bg-transparent"}`} />
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
                  Personal Details
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Let’s start by setting up your identity on Alimeriq.
                </p>
              </div>

              <form onSubmit={handleNextStep1} className="space-y-4">
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
          )}

          {/* STEP 2: IDENTITY VERIFICATION */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
                  Identity Verification
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Required for legal company registration and compliance.
                </p>
              </div>

              <form onSubmit={handleNextStep2} className="space-y-4">
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

                {/* UX Tip Helper Text Box */}
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
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded.xl bg-[#1C1C24] hover:bg-[#252530] text-gray-300 text-xs font-semibold rounded-xl border border-white/5 transition-all"
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
          )}

          {/* STEP 3: ROLE & INTENT SELECTION */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
                  What is your primary goal?
                </h2>
                <p className="text-sm text-gray-400 mt-1">
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
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-gray-300 font-mono">
                            {r.badge}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{r.desc}</p>
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
                  onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-xl bg-[#1C1C24] hover:bg-[#252530] text-gray-300 text-xs font-semibold border border-white/5 transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
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
          )}

        </div>
      </div>
    </div>
  );
}
