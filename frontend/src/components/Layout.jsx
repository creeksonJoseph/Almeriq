import React from "react";
import { Outlet } from "react-router-dom";
import HeaderNavigation from "./HeaderNavigation";
import OnboardingWizard from "./OnboardingWizard";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout, updateUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#0c0e13] text-white flex flex-col antialiased">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <HeaderNavigation currentUser={user} onLogout={logout} />

      <main
        id="main-content"
        tabIndex={-1}
        className="pt-20 flex-1 w-full flex flex-col outline-none"
      >
        <Outlet />
      </main>

      {/* Onboarding Wizard Modal if user is logged in but hasn't completed onboarding */}
      {user && !user.onboarding_completed && (
        <OnboardingWizard
          user={user}
          onComplete={(u) => updateUser(u)}
        />
      )}
    </div>
  );
}

