import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Drawer({
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

  const from = side === "left" ? "left-0 border-r" : "right-0 border-l";

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        className="fixed inset-0 bg-bg/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        tabIndex={-1}
        className={`fixed top-0 ${from} h-full w-full md:w-[420px] border-border bg-surface shadow-2xl outline-none flex flex-col ${className}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          {title ? (
            <h2 className="font-serif text-lg font-semibold text-text">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-lg p-1.5 text-white/60 hover:text-text hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}