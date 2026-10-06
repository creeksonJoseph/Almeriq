import React, { useState, useEffect } from "react";
import WaitlistPage from "./pages/WaitlistPage";
import AuthGate from "./components/AuthGate";
import OnboardingWizard from "./components/OnboardingWizard";
import Dashboard from "./components/Dashboard";
import BrandLogo from "./components/BrandLogo";
import { getMeApi, logoutApi } from "./lib/api";
import "./App.css";
import "./index.css";

function BackgroundLayers() {
  return (
    <>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,161,90,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(62,131,104,0.06) 0%, transparent 70%)" }} />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />
    </>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [viewMode, setViewMode] = useState("home"); // "home" | "dashboard"

  useEffect(() => {
    async function checkSession() {
      try {
        const user = await getMeApi();
        if (user) {
          setCurrentUser(user);
          if (user.onboarding_completed) {
            setViewMode("dashboard");
          }
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setLoadingUser(false);
      }
    }
    checkSession();
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    if (user.onboarding_completed) {
      setViewMode("dashboard");
    }
  };

  const handleOnboardingComplete = (updatedUser) => {
    setCurrentUser(updatedUser);
    setViewMode("dashboard");
  };

  const handleLogout = async () => {
    await logoutApi();
    setCurrentUser(null);
    setViewMode("home");
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <BackgroundLayers />

      {/* Floating Fluid Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0c0e13]/85 backdrop-blur-xl border-b border-[#282a2f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6 cursor-pointer" onClick={() => setViewMode("home")}>
            <BrandLogo size={24} />
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "dashboard" ? "home" : "dashboard")}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all"
                >
                  {viewMode === "dashboard" ? "View Platform" : "Go to Dashboard"}
                </button>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181824] border border-white/10 text-xs text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-[#C9A15A]" />
                  <span className="font-semibold text-white truncate max-w-[120px]">
                    {currentUser.full_name || currentUser.email.split("@")[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-full text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2.5 rounded-full bg-[#C9A15A] text-[#0A0A0B] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-[0_0_24px_-4px_rgba(201,161,90,0.4)]"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main id="main-content" tabIndex={-1} className="pt-24 min-h-[100dvh] pb-12 outline-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {viewMode === "dashboard" && currentUser && currentUser.onboarding_completed ? (
            <Dashboard
              user={currentUser}
              onLogout={handleLogout}
              onRestartOnboarding={() => {
                setCurrentUser({ ...currentUser, onboarding_completed: false });
              }}
            />
          ) : (
            <WaitlistPage onOpenAuth={() => setShowAuthModal(true)} />
          )}
        </div>
      </main>

      {/* PHASE 1: Low-Friction Gate Auth Modal */}
      {showAuthModal && !currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
          <div className="relative w-full max-w-md my-auto">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-12 right-0 text-gray-400 hover:text-white text-sm font-semibold flex items-center gap-1"
            >
              ✕ Close
            </button>
            <AuthGate onAuthSuccess={handleAuthSuccess} />
          </div>
        </div>
      )}

      {/* PHASE 2: Post-Signup Onboarding Wizard Modal */}
      {currentUser && !currentUser.onboarding_completed && (
        <OnboardingWizard
          user={currentUser}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
}
