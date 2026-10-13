import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import HeaderNavigation from "./HeaderNavigation";
import AppSidebar from "./AppSidebar";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";

export default function Layout() {
  const { user, logout, updateUser } = useAuth();
  const { collapsed, toggleCollapse, mobileOpen, openMobile, closeMobile } = useSidebar();
  const location = useLocation();

  const isAuthPage = [
    "/login",
    "/signup",
    "/register",
    "/forgot-password",
  ].includes(location.pathname);

  // User is logged in and past onboarding in the application workspace
  // The sidebar remains intact across all pages once the user is onboarded
  const isPostOnboarding = Boolean(user && user.onboarding_completed);
  const isWorkspace = isPostOnboarding && !isAuthPage;

  return (
    <div className="min-h-screen bg-[#0c0e13] text-white flex flex-col antialiased">
      {/* 
        Header navigation:
        - Once logged in & past onboarding in workspace: HIDDEN on desktop, visible ONLY on mobile phones.
        - On marketing / auth pages: visible across all screens (except auth pages).
      */}
      {!isAuthPage && (
        isWorkspace ? (
          <div className="block lg:hidden">
            <HeaderNavigation
              currentUser={user}
              onLogout={logout}
              onOpenSidebar={openMobile}
            />
          </div>
        ) : (
          <HeaderNavigation currentUser={user} onLogout={logout} />
        )
      )}

      {/* 
        Workspace Left-Attached Collapsible Sidebar:
        - Attached flush to the left screen edge
        - Fixed full height
        - Collapsible to compact icon rail
      */}
      {isWorkspace && (
        <AppSidebar
          user={user}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          mobileOpen={mobileOpen}
          onCloseMobile={closeMobile}
          onLogout={logout}
          onRestartOnboarding={() => updateUser({ onboarding_completed: false })}
        />
      )}

      {/* 
        Main content container:
        - When in workspace: adjusts left padding to match sidebar width on desktop, flush with screen top.
        - On mobile: standard padding for mobile header.
      */}
      <main
        id="main-content"
        tabIndex={-1}
        className={`flex-1 w-full flex flex-col outline-none transition-[padding] duration-300 ease-in-out ${
          isAuthPage
            ? "pt-0 pl-0"
            : isWorkspace
            ? `pt-16 sm:pt-20 lg:pt-0 ${collapsed ? "lg:pl-[68px]" : "lg:pl-64"}`
            : "pt-20 pl-0"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
