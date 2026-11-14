import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  ShoppingCart,
  Bell,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { to: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/provider/listings", label: "Listings", icon: List },
  { to: "/provider/orders", label: "Orders", icon: ShoppingCart },
  { to: "/alerts", label: "Alerts", icon: Bell },
];

function NavItem({ to, label, icon: Icon, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-[#f2ca50]/15 text-[#f2ca50]"
            : "text-[#ffffff]/60 hover:text-[#ffffff] hover:bg-[#111318]"
        }`
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}

export default function AppShell() {
  const [rail, setRail] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-bg text-text flex w-full">
      {/* Desktop sidebar (lg+) */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col border-r border-border bg-bg transition-[width] duration-200 ${
          rail ? "w-[68px]" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          {!rail ? (
            <span className="font-serif text-lg font-semibold text-gold">ALIMERIQ</span>
          ) : (
            <span className="font-serif text-sm font-semibold text-gold mx-auto">A</span>
          )}
          <button
            type="button"
            onClick={() => setRail((v) => !v)}
            className={`rounded-lg p-1.5 text-white/60 hover:text-text hover:bg-surface-2 ${rail ? "hidden" : ""}`}
            aria-label="Collapse sidebar"
          >
            <Menu size={16} />
          </button>
        </div>
        {rail ? (
          <button
            type="button"
            onClick={() => setRail(false)}
            className="mx-auto mt-2 rounded-lg p-1.5 text-white/60 hover:text-text hover:bg-surface-2"
            aria-label="Expand sidebar"
          >
            <Menu size={16} />
          </button>
        ) : null}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} collapsed={rail} />
          ))}
        </nav>
      </aside>

      {/* Icon rail (md–lg) */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 bottom-0 z-40 w-[68px] flex-col border-r border-border bg-bg">
        <div className="flex items-center justify-center border-b border-border py-3">
          <span className="font-serif text-sm font-semibold text-gold">A</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} collapsed />
          ))}
        </nav>
      </aside>

      {/* Mobile header + drawer trigger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-bg/95 backdrop-blur px-4 py-3">
        <span className="font-serif text-base font-semibold text-gold">ALIMERIQ</span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-white/60 hover:text-text hover:bg-surface-2"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-bg/70" onClick={closeMobile} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 w-72 border-r border-border bg-bg p-3 flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
              <span className="font-serif text-lg font-semibold text-gold">ALIMERIQ</span>
              <button
                type="button"
                onClick={closeMobile}
                className="rounded-lg p-1.5 text-white/60 hover:text-text hover:bg-surface-2"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavItem key={item.to} {...item} collapsed={false} onClick={closeMobile} />
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[68px] lg:pl-0 lg:ml-0">
        <main
          className={`flex-1 w-full pt-14 pb-20 md:pt-0 md:pb-0 transition-[padding] duration-200 ${
            rail ? "lg:pl-[68px]" : "lg:pl-64"
          }`}
        >
          <Outlet key={location.pathname} />
        </main>
      </div>

      {/* Bottom tab bar below md */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[11px] ${
                      isActive ? "text-gold" : "text-white/60"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}