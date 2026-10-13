import { useState } from "react";
import { Bot, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FounderFlowLayout, { FlowNextLink } from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";

const FIELDS = [
  ["idea", "What are you building?", "Describe the idea in one or two sentences.", 500],
  ["problem", "What problem does it solve?", "Who experiences this problem and why does it matter now?", 500],
  ["solution", "How does it work?", "Explain the product or service and its core outcome.", 500],
  ["customer", "Who will pay first?", "Name your first customer segment, not everyone.", 200],
  ["location", "Where will you launch?", "City, country, or market you understand best.", 200],
];

export default function FounderIntakePage() {
  const navigate = useNavigate();
  const { form, setForm, analyze, loading, error, ventureId, saveSuccess, setSaveSuccess } = useFounderFlow();
  const [validationError, setValidationError] = useState("");
  const [showEditWarning, setShowEditWarning] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setValidationError("");
    
    if (ventureId && !showEditWarning) {
      setShowEditWarning(true);
      return;
    }

    try {
      await analyze();
      navigate("/founder/analysis");
    } catch (err) {
      // Error already set in hook
    }
  };

  const dismissError = () => {
    setSaveSuccess(false);
  };

  return (
    <FounderFlowLayout>
      <div className="mb-7 max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Step 1 · Venture brief</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Start with the context you have.</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">Answer five focused questions. You can return and refine this brief as your company becomes clearer.</p>
      </div>

      {saveSuccess && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/30 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-300">Venture saved successfully</p>
              <p className="text-xs text-green-200/70">Ref: ALQ-VNT-{String(ventureId).padStart(6, "0")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissError}
            className="text-green-400 hover:text-green-300"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {showEditWarning && (
        <div className="mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Update this venture?</p>
              <p className="text-xs text-amber-200/70 mt-1">You already have an analysis for this brief. Submitting again will create a new analysis and replace the previous one.</p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditWarning(false);
                    submit({ preventDefault: () => {} });
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                >
                  Yes, update analysis
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditWarning(false)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#12121a] p-5 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <Bot size={18} className="text-[#f2ca50]" />
          <div><h2 className="font-display text-xl font-semibold text-white">Your venture brief</h2><p className="mt-1 text-xs text-white/45">Be specific. We will use this to create your first build plan.</p></div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {FIELDS.map(([key, label, placeholder, maxLength]) => (
            <label key={key} className={key === "idea" || key === "problem" || key === "solution" ? "md:col-span-2" : ""}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/75">{label}</span>
                <span className={`text-xs font-medium ${
                  form[key].length > maxLength * 0.9
                    ? "text-red-400"
                    : form[key].length > maxLength * 0.75
                      ? "text-yellow-400"
                      : "text-white/45"
                }`}>
                  {form[key].length}/{maxLength}
                </span>
              </div>
              {key === "idea" || key === "problem" || key === "solution" ? (
                <textarea required minLength={10} maxLength={maxLength} rows={3} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className="alq-input min-h-24 resize-y" />
              ) : (
                <input required minLength={2} maxLength={maxLength} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className="alq-input" />
              )}
            </label>
          ))}
        </div>
        
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300">Analysis failed</p>
              <p className="text-xs text-red-200/70 mt-1">{error}</p>
              <p className="text-xs text-red-200/50 mt-2">Try again or contact support if the problem persists.</p>
            </div>
          </div>
        )}
        
        {validationError && (
          <div className="mt-5 rounded-xl bg-red-500/10 border border-red-500/30 p-3">
            <p className="text-sm text-red-200">{validationError}</p>
          </div>
        )}
        
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/35">Your brief is automatically saved to your account.</p>
          <button type="submit" disabled={loading} className="alq-submit sm:w-auto sm:px-8" aria-disabled={loading}>
            {loading ? <><Loader2 size={17} className="alq-spinner" /> Preparing analysis...</> : <>Analyze my venture <span aria-hidden="true">→</span></>}
          </button>
        </div>
      </form>
      <div className="mt-5 text-right"><FlowNextLink to="/founder/analysis">View analysis</FlowNextLink></div>
    </FounderFlowLayout>
  );
}
