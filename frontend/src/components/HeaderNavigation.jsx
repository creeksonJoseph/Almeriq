import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

export default function HeaderNavigation({
  currentUser,
  onLogout,
}) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo Link to Home */}
        <Link to="/" className="flex items-center gap-6 cursor-pointer">
          <BrandLogo size={24} />
        </Link>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(path === "/dashboard" ? "/" : "/dashboard")
                }
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all"
              >
                {path === "/dashboard" ? "View Platform" : "Go to Dashboard"}
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181824] border border-white/10 text-xs text-gray-300">
                <span className="w-2 h-2 rounded-full bg-[#C9A15A]" />
                <span className="font-semibold text-white truncate max-w-[120px]">
                  {currentUser.full_name || currentUser.email.split("@")[0]}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-2 rounded-full text-xs text-gray-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Sign In Link */}
              <Link
                to="/login"
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  path === "/login"
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-transparent border-white/10 text-gray-300 hover:text-white hover:border-white/20"
                }`}
              >
                Sign In
              </Link>

              {/* Join Waitlist CTA Button */}
              <button
                type="button"
                onClick={handleJoinWaitlist}
                className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_24px_-4px_rgba(201,161,90,0.4)] bg-[#C9A15A] hover:bg-[#d4af37] text-[#0A0A0B] cursor-pointer"
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

