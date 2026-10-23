import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Cpu,
  Boxes,
  Scale,
  Send,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import ActiveIdeaDropdown from "./ActiveIdeaDropdown";

export const WORKSPACE_NAV = [
  { key: "overview", label: "Overview", path: "/dashboard", icon: Home },
  { key: "ventures", label: "Saved Ventures", path: "/founder/ventures", icon: BookOpen },
  { key: "intake", label: "Share New Idea", path: "/founder/intake?mode=new", icon: Lightbulb },
];

export const FOUNDER_STUDIO_NAV = [
  { key: "validation", label: "Idea Validation", path: "/founder/validation", icon: CheckCircle2 },
  { key: "product", label: "Product Development", path: "/founder/product", icon: Boxes },
  { key: "legal", label: "Legal & Setup", path: "/founder/legal", icon: Scale },
];

export default function AppSidebar({
  user,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onLogout,
  onRestartOnboarding,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || "founder";

  const isCurrentActive = (itemPath) => {
    if (itemPath.includes("?tab=")) {
      const tabParam = itemPath.split("?tab=")[1];
      const searchParams = new URLSearchParams(location.search);
      return location.pathname === "/dashboard" && searchParams.get("tab") === tabParam;
    }
    if (itemPath === "/dashboard") {
      const searchParams = new URLSearchParams(location.search);
      return (location.pathname === "/dashboard" || location.pathname === "/") && !searchParams.get("tab");
    }
    const baseItemPath = itemPath.split("?")[0];
    if (baseItemPath === "/founder/intake") {
      return location.pathname === "/founder/intake";
    }
    return location.pathname === itemPath;
  };

  const handleNavClick = (path) => {
    onCloseMobile();
    navigate(path);
  };

  // Derive user initials for profile anchor
  const userInitials = (
    user?.full_name
      ? user.full_name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
      : user?.email
      ? user.email.slice(0, 2)
      : "ME"
  ).toUpperCase();

  const userName = user?.full_name || user?.email?.split("@")[0] || "Founder";

  const navContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex h-full flex-col justify-between py-3 select-none">
        {/* ── APEX TIER: Brand Logo & Collapse Trigger ── */}
        <div className="px-3">
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            } pb-3 border-b border-[#232328]`}
          >
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => handleNavClick("/dashboard")}
                title="ALMERIQ Home"
                className="p-1 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer"
              >
                <BrandLogo size={24} showName={false} href="/dashboard" />
              </button>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => handleNavClick("/dashboard")}
                  className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity cursor-pointer"
                  title="ALMERIQ Workspace"
                >
                  <BrandLogo size={24} showName={true} href="/dashboard" />
                </button>
              </div>
            )}

            {/* Desktop Collapse Toggle Button */}
            {!isMobile && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>
            )}

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* ── APEX CONTEXT SWITCHER: Active Venture ── */}
          <div className="pt-3 pb-1">
            <ActiveIdeaDropdown variant="sidebar" collapsed={isCollapsed} />
          </div>
        </div>

        {/* ── SCROLLABLE NAVIGATION BODY ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-4 no-scrollbar">
          {/* GROUP 1: Workspace Essentials */}
          <div>
            {!isCollapsed && (
              <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                Workspace
              </p>
            )}
            <div className="space-y-0.5">
              {WORKSPACE_NAV.map((item) => {
                const Icon = item.icon;
                const active = isCurrentActive(item.path);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.path)}
                    title={isCollapsed ? item.label : undefined}
                    className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-all cursor-pointer ${
                      isCollapsed ? "justify-center px-0 h-9" : "h-9"
                    } ${
                      active
                        ? "bg-[#C9A15A]/12 text-[#E8D6A8] font-semibold"
                        : "text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    {active && !isCollapsed && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#C9A15A]" />
                    )}
                    <Icon
                      size={16}
                      className={`shrink-0 transition-colors ${
                        active
                          ? "text-[#C9A15A]"
                          : "text-white/70 group-hover:text-white"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GROUP 2: Tools */}
          {role === "founder" && (
            <div>
              {!isCollapsed && (
                <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                  Tools
                </p>
              )}
              <div className="space-y-0.5">
                {FOUNDER_STUDIO_NAV.map((tool) => {
                  const Icon = tool.icon;
                  const active = isCurrentActive(tool.path);
                  return (
                    <button
                      key={tool.key}
                      type="button"
                      onClick={() => handleNavClick(tool.path)}
                      title={isCollapsed ? tool.label : undefined}
                      className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-all cursor-pointer ${
                        isCollapsed ? "justify-center px-0 h-9" : "h-9"
                      } ${
                        active
                          ? "bg-[#C9A15A]/12 text-[#E8D6A8] font-semibold"
                          : "text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      {active && !isCollapsed && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#C9A15A]" />
                      )}
                      <Icon
                        size={16}
                        className={`shrink-0 transition-colors ${
                          active
                            ? "text-[#C9A15A]"
                            : "text-white/70 group-hover:text-white"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{tool.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GROUP 3: Administration (Admin Only) */}
          {Boolean(user?.is_admin) && (
            <div>
              {!isCollapsed && (
                <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]/60">
                  Administration
                </p>
              )}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleNavClick("/admin/waitlist")}
                  title={isCollapsed ? "Waitlist Console" : undefined}
                  className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-all cursor-pointer ${
                    isCollapsed ? "justify-center px-0 h-9" : "h-9"
                  } ${
                    location.pathname.startsWith("/admin")
                      ? "bg-[#f2ca50]/12 text-[#f2ca50] font-semibold"
                      : "text-white/65 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {location.pathname.startsWith("/admin") && !isCollapsed && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#f2ca50]" />
                  )}
                  <ShieldCheck
                    size={16}
                    className={`shrink-0 ${
                      location.pathname.startsWith("/admin")
                        ? "text-[#f2ca50]"
                        : "text-white/45 group-hover:text-white/80"
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">Waitlist Console</span>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER TIER: User Identity & Quick Settings ── */}
        <div className="px-3 pt-3 border-t border-[#232328]">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleNavClick("/settings")}
                title={`Settings (${userName})`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A15A]/30 to-[#C9A15A]/10 border border-[#C9A15A]/25 text-[#E8D6A8] hover:opacity-90 transition-opacity cursor-pointer text-xs font-bold"
              >
                {userInitials}
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseMobile();
                  onLogout();
                }}
                title="Sign Out"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-300/60 hover:text-rose-200 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-1 py-0.5">
              {/* User Avatar + Info */}
              <button
                type="button"
                onClick={() => handleNavClick("/settings")}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer flex-1"
                title="Account Settings"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A15A]/30 to-[#C9A15A]/10 border border-[#C9A15A]/25 text-[#E8D6A8] font-bold text-xs">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {userName}
                  </p>
                  <p className="truncate text-[10px] text-white/40 capitalize">
                    {role.replace("_", " ")}
                  </p>
                </div>
              </button>

              {/* Action triggers */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavClick("/settings")}
                  title="Settings"
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Settings size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCloseMobile();
                    onLogout();
                  }}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-rose-300/60 hover:text-rose-200 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Attached Sidebar (Fixed to screen left edge) */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 bg-[#0A0A0B] border-r border-[#1f2025] flex-col transition-[width] duration-300 ease-in-out ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {navContent(false)}
      </aside>

      {/* Mobile Drawer (Slide-over overlay on mobile phones) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 bg-[#0A0A0B] border-r border-[#1f2025] shadow-2xl">
            {navContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
