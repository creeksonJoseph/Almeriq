import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import HeaderNavigation from "./HeaderNavigation";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAuthPage = ["/login", "/signup", "/register", "/forgot-password", "/reset-password"].includes(
    location.pathname,
  );

  return (
    <div className="min-h-screen bg-[#0c0e13] text-white flex flex-col antialiased">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {!isAuthPage && <HeaderNavigation currentUser={user} onLogout={logout} />}

      <main
        id="main-content"
        tabIndex={-1}
        className={`${isAuthPage ? "pt-0" : "pt-20"} flex-1 w-full flex flex-col outline-none`}
      >
        <Outlet />
      </main>
    </div>
  );
}
