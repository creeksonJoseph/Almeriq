import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

/**
 * ConfirmModal - Accessible, modern custom modal for destructive or important actions.
 * Replaces native browser window.confirm().
 */
export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl transition-all sm:p-7 z-10 animate-in zoom-in-95 duration-200">
        {/* Subtle accent glow */}
        <div
          className={`absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl pointer-events-none ${
            danger ? "bg-rose-500/15" : "bg-[#f2ca50]/15"
          }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            if (!loading) onCancel();
          }}
          disabled={loading}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              danger
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                : "border-[#f2ca50]/30 bg-[#f2ca50]/10 text-[#f2ca50]"
            }`}
          >
            {danger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id="confirm-modal-title"
              className="font-display text-lg font-bold text-white tracking-tight"
            >
              {title}
            </h2>
            <p
              id="confirm-modal-description"
              className="mt-2 text-xs leading-relaxed text-white/60"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-7 flex items-center justify-end gap-3 border-t border-white/5 pt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 ${
              danger
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-rose-900/30"
                : "bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] text-[#0A0A0B] hover:brightness-105"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
