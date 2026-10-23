import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import BrandLogo from "./BrandLogo";
import ActiveIdeaDropdown from "./ActiveIdeaDropdown";

function UserAvatar({ user, size = "sm" }) {
  const initial = (user?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase();
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#f2ca50]/15 border border-[#f2ca50]/30 font-bold text-[#f2ca50] uppercase select-none ${
        size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-xs"
      }`}
    >
      {initial}
    </span>
  );
}

export default function HeaderNavigation({ currentUser, onLogout, onOpenSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const handleJoinWaitlist = (e) => {
    e.preventDefault();
    if (path === "/") {
      const el = document.getElementById("access-console");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/#access-console");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0e13]/90 backdrop-blur-xl border-b border-[#1e2025]">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 min-w-0">
        {/* Left Side: Hamburger (mobile workspace) & Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          {currentUser && onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="lg:hidden p-1.5 -ml-1 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
          )}
          {/* Brand Logo Link to Home */}
          <BrandLogo size={22} href="/" className="cursor-pointer shrink-0" />
        </div>

        {/* Right Side: Workspace Context (Active Idea & Profile Avatar) or Marketing Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {currentUser ? (
            onOpenSidebar ? (
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <ActiveIdeaDropdown variant="header" />
                <button
                  type="button"
                  onClick={onOpenSidebar}
                  className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-[#f2ca50]/40 transition-all cursor-pointer shrink-0"
                  aria-label="Open workspace menu"
                  title={currentUser.full_name || currentUser.email}
                >
                  <UserAvatar user={currentUser} size="sm" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    navigate(path === "/dashboard" ? "/" : "/dashboard")
                  }
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all shrink-0"
                >
                  {path === "/dashboard" ? "Platform" : "Dashboard"}
                </button>

                <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#181824] border border-white/10 text-xs text-white shrink-0">
                  <UserAvatar user={currentUser} size="sm" />
                  <span className="font-semibold text-white truncate max-w-[120px]">
                    {currentUser.full_name || (currentUser.email && typeof currentUser.email === 'string' ? currentUser.email.split("@")[0] : "User")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs text-white/80 hover:text-white transition-colors shrink-0"
                >
                  Sign Out
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3 shrink-0">
              {/* Join Waitlist CTA Button */}
              <button
                type="button"
                onClick={handleJoinWaitlist}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_24px_-4px_rgba(201,161,90,0.4)] bg-[#C9A15A] hover:bg-[#d4af37] text-[#0A0A0B] cursor-pointer shrink-0"
              >
                Join Waitlist
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
