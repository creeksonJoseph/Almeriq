import React, { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
    </svg>
  ),
};

const STYLES = {
  success: "bg-[#13141a] border border-[#f2ca50]/30 text-[#f2ca50]",
  error:   "bg-[#13141a] border border-red-500/30 text-red-300",
  info:    "bg-[#13141a] border border-white/10 text-white/80",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = "info", duration = 4000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (msg) => show(msg, "success"),
    error:   (msg) => show(msg, "error"),
    info:    (msg) => show(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-6 left-1/2 z-9999 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 flex-col items-center gap-2 pointer-events-none sm:top-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex w-full max-w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-medium shadow-lg pointer-events-auto ${STYLES[t.type]}`}
            style={{ animation: "alq-step-in 300ms cubic-bezier(0.32,0.72,0,1) both" }}
          >
            {ICONS[t.type]}
            <span className="min-w-0 flex-1 wrap-break-word">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 opacity-50 hover:opacity-100"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
