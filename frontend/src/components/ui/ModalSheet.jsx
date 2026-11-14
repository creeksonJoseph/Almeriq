import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  ariaLabel,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const panel = panelRef.current;
    const focusFirst = () => {
      const first = panel?.querySelector(FOCUSABLE);
      (first || panel)?.focus();
    };
    focusFirst();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === "Tab" && panel) {
        const nodes = Array.from(panel.querySelectorAll(FOCUSABLE));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl outline-none ${className}`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          {title ? <h2 className="font-serif text-lg font-semibold text-text">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-white/60 hover:text-text hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "right",
  className = "",
  ariaLabel,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector(FOCUSABLE);
    (first || panel)?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === "Tab" && panel) {
        const nodes = Array.from(panel.querySelectorAll(FOCUSABLE));
        if (!nodes.length) return;
        const f = nodes[0];
        const l = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === f) {
          e.preventDefault();
          l.focus();
        } else if (!e.shiftKey && document.activeElement === l) {
          e.preventDefault();
          f.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const sideClass =
    side === "left" ? "left-0 border-r" : side === "bottom" ? "bottom-0 left-0 right-0 border-t max-h-[85vh]" : "right-0 border-l";

  const sizeClass = side === "bottom" ? "w-full" : "top-0 h-full w-full max-w-md";

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        tabIndex={-1}
        className={`fixed ${sideClass} ${sizeClass} z-10 border-border bg-surface p-6 shadow-xl outline-none overflow-y-auto ${className}`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          {title ? <h2 className="font-serif text-lg font-semibold text-text">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-white/60 hover:text-text hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}