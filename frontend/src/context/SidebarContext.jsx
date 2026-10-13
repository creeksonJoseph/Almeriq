import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const location = useLocation();

  // Desktop collapsed state, persisted in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("almeriq_sidebar_collapsed") === "true";
  });

  // Mobile drawer open/closed state
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("almeriq_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Auto-close mobile drawer when location / route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleCollapse,
        mobileOpen,
        openMobile,
        closeMobile,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      collapsed: false,
      toggleCollapse: () => {},
      mobileOpen: false,
      openMobile: () => {},
      closeMobile: () => {},
      setMobileOpen: () => {},
    };
  }
  return context;
}
