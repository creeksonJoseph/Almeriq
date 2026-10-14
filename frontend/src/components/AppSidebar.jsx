import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Clock3,
  BriefcaseBusiness,
  UserRound,
  Compass,
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
  ChevronDown,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import BrandLogo from "./BrandLogo";

export const PRIMARY_NAV = [
  { key: "overview", label: "Overview", path: "/dashboard", icon: Home },
  { key: "tasks", label: "Build Tasks", path: "/dashboard?tab=tasks", icon: Clock3 },
  { key: "capital", label: "Capital Readiness", path: "/dashboard?tab=capital", icon: BriefcaseBusiness },
  { key: "team", label: "Team & Roles", path: "/dashboard?tab=team", icon: UserRound },
];

export const FOUNDER_STUDIO_NAV = [
  { label: "Studio Hub", path: "/founder", icon: Compass },
  { label: "Venture Brief", path: "/founder/intake", icon: Lightbulb },
  { label: "Explored Ventures", path: "/founder/ventures", icon: BookOpen },
  { label: "Idea Validation", path: "/founder/validation", icon: CheckCircle2 },
  { label: "AI Business Builder", path: "/founder/ai-tools", icon: Cpu },
  { label: "Product Dev", path: "/founder/product", icon: Boxes },
  { label: "Legal & Filings", path: "/founder/legal", icon: Scale },
  { label: "Outreach & Hiring", path: "/founder/outreach", icon: Send },
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
  const isFounderActive = location.pathname.startsWith("/founder");

  const [studioOpen, setStudioOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("almeriq_sidebar_studio_open");
      if (saved !== null) return saved === "true";
      return true; // Default open so links are readily accessible, collapsible at will
    } catch {
      return true;
    }
  });

  const toggleStudioOpen = (e) => {
    if (e) e.stopPropagation();
    setStudioOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("almeriq_sidebar_studio_open", String(next));
      } catch {}
      return next;
    });
  };

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
    return location.pathname === itemPath;
  };

  const handleNavClick = (path) => {
    onCloseMobile();
    navigate(path);
  };

  const navContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex h-full flex-col justify-between py-4 select-none">
        {/* Top Header / Brand */}
        <div className="px-3">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} pb-4 border-b border-[#232328]`}>
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => handleNavClick("/dashboard")}
                title="ALIMERIQ Home"
                className="p-1 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer"
              >
                <BrandLogo size={24} showName={false} href="/dashboard" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleNavClick("/dashboard")}
                  className="flex flex-col min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
                  title="ALIMERIQ Workspace Overview"
                >
                  <BrandLogo size={24} showName={true} href="/dashboard" />
                  <span className="text-[10px] text-white/45 truncate capitalize pl-8 -mt-1">
                    {role.replace("_", " ")} workspace
                  </span>
                </button>
              </div>
            )}

            {/* Desktop Collapse Toggle Button */}
            {!isMobile && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={`p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors ${
                  isCollapsed ? "mt-2" : ""
                }`}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-6 no-scrollbar">
          {/* Main workspace items */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                Workspace
              </p>
            )}
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item.path);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavClick(item.path)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all ${
                    isCollapsed ? "justify-center px-0" : ""
                  } ${
                    active
                      ? "bg-[#C9A15A]/15 text-[#E8D6A8] border border-[#C9A15A]/30 shadow-sm"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 ${active ? "text-[#C9A15A]" : "text-white/50"}`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Founder Studio Collapsible Group */}
          {role === "founder" && (
            <div className="pt-2 border-t border-[#232328]">
              {isCollapsed ? (
                /* Compact Rail Mode: single icon navigating directly to Founder Studio Hub */
                <button
                  type="button"
                  onClick={() => handleNavClick("/founder")}
                  title={`Founder Studio (${FOUNDER_STUDIO_NAV.length} tools)`}
                  className={`flex w-full items-center justify-center rounded-xl p-2.5 transition-all ${
                    isFounderActive
                      ? "bg-[#C9A15A]/15 text-[#E8D6A8] border border-[#C9A15A]/30 shadow-sm"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Compass
                    size={18}
                    className={isFounderActive ? "text-[#C9A15A]" : "text-white/50"}
                  />
                </button>
              ) : (
                /* Expanded Mode: Collapsible Dropdown Accordion */
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={toggleStudioOpen}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${
                      isFounderActive
                        ? "bg-[#C9A15A]/10 text-[#E8D6A8] border border-[#C9A15A]/25"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate font-semibold tracking-wide">
                      Founder Studio
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-white/40 transition-transform duration-200 ${
                        studioOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Collapsible Dropdown Sub-links */}
                  {studioOpen && (
                    <div className="mt-1 ml-3 pl-2.5 border-l border-[#232328] space-y-0.5">
                      {FOUNDER_STUDIO_NAV.map((tool) => {
                        const Icon = tool.icon;
                        const active = isCurrentActive(tool.path);
                        return (
                          <button
                            key={tool.path}
                            type="button"
                            onClick={() => handleNavClick(tool.path)}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition-all ${
                              active
                                ? "bg-[#C9A15A]/15 text-[#E8D6A8] font-semibold"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <Icon
                              size={14}
                              className={`shrink-0 ${active ? "text-[#C9A15A]" : "text-white/45"}`}
                            />
                            <span className="truncate">{tool.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admin Waitlist Section (Admin Only - below Founder Studio) */}
          {Boolean(user?.is_admin) && (
            <div className="pt-2 border-t border-[#232328]">
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => handleNavClick("/admin/waitlist")}
                  title="Admin Waitlist Console"
                  className={`flex w-full items-center justify-center rounded-xl p-2.5 transition-all ${
                    location.pathname.startsWith("/admin")
                      ? "bg-[#f2ca50]/15 text-[#f2ca50] border border-[#f2ca50]/30 shadow-sm"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <ShieldCheck
                    size={18}
                    className={location.pathname.startsWith("/admin") ? "text-[#f2ca50]" : "text-white/50"}
                  />
                </button>
              ) : (
                <div className="space-y-1">
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#f2ca50]/70">
                    Administration
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavClick("/admin/waitlist")}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${
                      location.pathname.startsWith("/admin")
                        ? "bg-[#f2ca50]/15 text-[#f2ca50] border border-[#f2ca50]/30 font-semibold shadow-sm"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <ShieldCheck
                      size={16}
                      className={`shrink-0 ${
                        location.pathname.startsWith("/admin") ? "text-[#f2ca50]" : "text-white/50"
                      }`}
                    />
                    <span className="truncate">Waitlist Console</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-2 pt-3 border-t border-[#232328] space-y-1">
          {onRestartOnboarding && (
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onRestartOnboarding();
              }}
              title={isCollapsed ? "Edit Onboarding Profile" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-white/50 hover:bg-white/5 hover:text-white transition-colors ${
                isCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <Settings size={16} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Edit Profile</span>}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onLogout();
            }}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-200 transition-colors ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Attached Sidebar (Fixed to screen left edge) */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 bg-[#0A0A0B] border-r border-[#232328] flex-col transition-[width] duration-300 ease-in-out ${
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
          <div className="fixed inset-y-0 left-0 w-72 bg-[#0A0A0B] border-r border-[#232328] shadow-2xl">
            {navContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
