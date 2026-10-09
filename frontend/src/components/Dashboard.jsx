import { logoutApi } from "../lib/api";
import RoleDashboard from "./RoleDashboard";

export default function Dashboard(props) {
  return <RoleDashboard {...props} />;
}

function LegacyDashboard({ user, onLogout, onRestartOnboarding }) {
  const handleLogout = async () => {
    await logoutApi();
    if (onLogout) onLogout();
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "founder":
        return "Founder / Entrepreneur";
      case "investor":
        return "Investor / VC";
      case "infrastructure":
        return "Infrastructure Provider";
      case "job_seeker":
        return "Talent / Job Seeker";
      default:
        return role || "Member";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner / Welcome Shell */}
      <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-2 md:p-3 backdrop-blur-2xl shadow-2xl">
        <div className="bg-[#0D0D14] rounded-[calc(2.5rem-0.5rem)] border border-white/5 p-6 md:p-10 relative overflow-hidden">
          
          {/* Glowing Mesh Orbs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#C9A15A]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#3E8368]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#3E8368]/15 border border-[#3E8368]/30 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#52B788]">
                  Verified Account
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-white font-mono">
                  {getRoleLabel(user?.role)}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">
                Welcome, {user?.full_name || user?.email?.split("@")[0]}
              </h1>
              <p className="text-sm text-white mt-1">
                Your workspace is active and your identity verification is recorded.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onRestartOnboarding}
                className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-400 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Account Overview */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-2 backdrop-blur-xl">
          <div className="bg-[#12121A] rounded-[calc(2rem-0.375rem)] p-6 space-y-4 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white uppercase tracking-widest">Account</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-white">Email Address</p>
              <p className="text-sm font-semibold text-white font-mono truncate">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-white">Member ID</p>
              <p className="text-xs text-white font-mono">ALQ-USR-{String(user?.id).padStart(5, "0")}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Identity & Compliance */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-2 backdrop-blur-xl">
          <div className="bg-[#12121A] rounded-[calc(2rem-0.375rem)] p-6 space-y-4 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white uppercase tracking-widest">Legal Identity</span>
              <span className="text-[#C9A15A] text-xs font-semibold">Step 2 Verified</span>
            </div>
            <div>
              <p className="text-xs text-white">Nationality</p>
              <p className="text-sm font-semibold text-white">{user?.nationality || "Not specified"}</p>
            </div>
            <div>
              <p className="text-xs text-white">ID / Passport Ref</p>
              <p className="text-xs text-white font-mono">
                {user?.id_number ? `•••• •••• ${user.id_number.slice(-4)}` : "Verified"}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Intent & Role */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-2 backdrop-blur-xl">
          <div className="bg-[#12121A] rounded-[calc(2rem-0.375rem)] p-6 space-y-4 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white uppercase tracking-widest">Platform Role</span>
              <span className="text-xs font-semibold text-emerald-400">Active</span>
            </div>
            <div>
              <p className="text-xs text-white">Primary Intent</p>
              <p className="text-sm font-semibold text-[#C9A15A]">{getRoleLabel(user?.role)}</p>
            </div>
            <div>
              <p className="text-xs text-white">Onboarding Status</p>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span>✓ Phase 1 & 2 Completed</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Banner */}
      <div className="bg-[#12121A] rounded-[2rem] border border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <h3 className="text-xl font-display font-semibold text-white">
            Ready to explore Alimeriq Infrastructure?
          </h3>
          <p className="text-xs text-white mt-1">
            Access founder toolkits, investor capital matching, and registered infrastructure nodes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert("Welcome to Alimeriq Workspace!")}
          className="alq-submit group px-6 py-3 shrink-0"
        >
          <span>Launch Workspace</span>
          <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}

export { LegacyDashboard };
