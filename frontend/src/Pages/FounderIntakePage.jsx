import { useState } from "react";
import { Loader2, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FounderFlowLayout from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";
import { useToast } from "../context/ToastContext";
import { saveBriefApi } from "../lib/api";

const FIELDS = [
  ["idea", "What are you building?", "Describe the idea in one or two sentences.", 500],
  ["problem", "What problem does it solve?", "Who experiences this problem and why does it matter now?", 500],
  ["solution", "How does it work?", "Explain the product or service and its core outcome.", 500],
  ["customer", "Who will pay first?", "Name your first customer segment, not everyone.", 200],
  ["location", "Where will you launch?", "City, country, or market you understand best.", 200],
];

export default function FounderIntakePage() {
  const navigate = useNavigate();
  const { form, setForm, ventureId, setVentureId } = useFounderFlow();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Track the form snapshot that was used for the last save so we can detect changes
  const [savedFormSnapshot, setSavedFormSnapshot] = useState(() => {
    // If a ventureId already exists, treat the current sessionStorage form as already-saved
    try {
      const existing = window.localStorage.getItem("alimeriq_venture_id");
      if (existing) return JSON.parse(window.sessionStorage.getItem("alimeriq_founder_form") || "null");
    } catch { /* ignore */ }
    return null;
  });

  const formHasChanged = savedFormSnapshot
    ? FIELDS.some(([key]) => form[key] !== savedFormSnapshot[key])
    : true;

  const submit = async (event) => {
    event.preventDefault();

    // If the venture was already saved with the exact same form data, skip re-saving
    if (ventureId && !formHasChanged) {
      setSaveSuccess(true);
      setTimeout(() => navigate("/founder/analysis"), 400);
      return;
    }

    setLoading(true);
    try {
      const result = await saveBriefApi(form);
      setVentureId(result.venture_id);
      setSavedFormSnapshot({ ...form });
      setSaveSuccess(true);
      // Small delay so the user sees the success flash before navigating
      setTimeout(() => navigate("/founder/analysis"), 600);
    } catch (err) {
      showToast(err.message || "Failed to save your brief. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FounderFlowLayout>
      <div className="mb-7 max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Step 1 · Share your idea</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Tell us about your startup idea.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Answer 5 simple questions. We'll save your idea, then you can choose what kind of help you want.
        </p>
      </div>

      {saveSuccess && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-[#f2ca50]/10 border border-[#f2ca50]/30 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-[#f2ca50] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#f2ca50]">Idea saved - opening analysis...</p>
            </div>
          </div>
          <button type="button" onClick={() => setSaveSuccess(false)} className="text-[#f2ca50] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      <form onSubmit={submit} className="rounded-2xl border border-white/10 p-5 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Your startup idea</h2>
            <p className="mt-1 text-xs text-white/45">Be clear and direct. This is used to evaluate and build your plan.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {FIELDS.map(([key, label, placeholder, maxLength]) => (
            <label key={key} className={key === "idea" || key === "problem" || key === "solution" ? "md:col-span-2" : ""}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/75">{label}</span>
                <span
                  className={`text-xs font-medium ${form[key].length > maxLength * 0.9
                      ? "text-red-400"
                      : form[key].length > maxLength * 0.75
                        ? "text-yellow-400"
                        : "text-white/45"
                    }`}
                >
                  {form[key].length}/{maxLength}
                </span>
              </div>
              {key === "idea" || key === "problem" || key === "solution" ? (
                <textarea
                  required
                  minLength={10}
                  maxLength={maxLength}
                  rows={3}
                  value={form[key]}
                  onChange={(e) => setForm((cur) => ({ ...cur, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="alq-input min-h-24 resize-y"
                />
              ) : (
                <input
                  required
                  minLength={2}
                  maxLength={maxLength}
                  value={form[key]}
                  onChange={(e) => setForm((cur) => ({ ...cur, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="alq-input"
                />
              )}
            </label>
          ))}
        </div>

        <div className="mt-7 flex justify-end">
          <button type="submit" disabled={loading} className="alq-submit" aria-disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="alq-spinner" /> Saving...
              </>
            ) : ventureId && !formHasChanged ? (
              "Continue"
            ) : (
              "Save & Continue"
            )}
          </button>
        </div>
      </form>
    </FounderFlowLayout>
  );
}
