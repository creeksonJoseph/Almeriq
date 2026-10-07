import React from "react";
import { useOnboarding } from "../hooks/useOnboarding";
import StepPersonal from "./onboarding/StepPersonal";
import StepIdentity from "./onboarding/StepIdentity";
import StepRole from "./onboarding/StepRole";

export default function OnboardingWizard({ user, onComplete }) {
  const {
    step,
    setStep,
    fullName,
    setFullName,
    nationality,
    setNationality,
    idNumber,
    setIdNumber,
    role,
    setRole,
    loading,
    error,
    nextStep1,
    nextStep2,
    completeSetup,
  } = useOnboarding(user, onComplete);

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
              <span className="text-xs text-white font-mono">
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

          {/* Step Views */}
          {step === 1 && (
            <StepPersonal
              fullName={fullName}
              setFullName={setFullName}
              nationality={nationality}
              setNationality={setNationality}
              loading={loading}
              onSubmit={nextStep1}
            />
          )}

          {step === 2 && (
            <StepIdentity
              idNumber={idNumber}
              setIdNumber={setIdNumber}
              loading={loading}
              onBack={() => setStep(1)}
              onSubmit={nextStep2}
            />
          )}

          {step === 3 && (
            <StepRole
              role={role}
              setRole={setRole}
              loading={loading}
              onBack={() => setStep(2)}
              onSubmit={completeSetup}
            />
          )}

        </div>
      </div>
    </div>
  );
}
