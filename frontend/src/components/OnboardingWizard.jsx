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
    <div className="auth-screen">
      <div className="auth-scroll onboarding-scroll">
        <div
          className={`auth-content space-y-6 ${
            step === 3 ? "sm:max-w-2xl" : ""
          }`}
        >
          <div>
            <p className="text-xs text-white/70 font-mono mb-3">
              Step {step} of 3{" · "}
              {step === 1 && "Personal Info"}
              {step === 2 && "Identity Details"}
              {step === 3 && "Role & Intent"}
            </p>

            <div className="h-1.5 w-full bg-[#13141a] rounded-full overflow-hidden flex gap-1 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${step >= 1 ? "bg-[#f2ca50] w-1/3" : "bg-transparent"}`}
              />
              <div
                className={`h-full rounded-full transition-all duration-500 ${step >= 2 ? "bg-[#f2ca50] w-1/3" : "bg-transparent"}`}
              />
              <div
                className={`h-full rounded-full transition-all duration-500 ${step >= 3 ? "bg-[#f2ca50] w-1/3" : "bg-transparent"}`}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-200 text-xs">
              {error}
            </div>
          )}

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
