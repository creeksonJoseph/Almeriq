import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01"
      />
    </svg>
  ),
};

const STYLES = {
  success: "bg-[#13141a] border border-[#f2ca50]/30 text-[#f2ca50]",
  error: "bg-[#13141a] border border-red-500/30 text-red-300",
  info: "bg-[#13141a] border border-white/10 text-white/80",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const toastApi = useMemo(() => {
    const showFn = (message, type = "info", duration = 4000) => show(message, type, duration);
    return Object.assign(showFn, {
      show: (message, type = "info", duration = 4000) => show(message, type, duration),
      showToast: (message, type = "info", duration = 4000) => show(message, type, duration),
      success: (msg, duration) => show(msg, "success", duration),
      error: (msg, duration) => show(msg, "error", duration),
      info: (msg, duration) => show(msg, "info", duration),
      toast: (...args) => showFn(...args),
    });
  }, [show]);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div className="fixed right-3 top-3 z-[9999] flex w-[min(92vw,24rem)] flex-col items-stretch gap-2 pointer-events-none sm:right-5 sm:top-5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex w-full max-w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-medium shadow-lg pointer-events-auto ${STYLES[t.type]}`}
            style={{
              animation: "alq-step-in 300ms cubic-bezier(0.32,0.72,0,1) both",
            }}
          >
            {ICONS[t.type]}
            <span className="min-w-0 flex-1 break-words">{t.message}</span>
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
