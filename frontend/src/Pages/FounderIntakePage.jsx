import { useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FounderFlowLayout, { FlowNextLink } from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";

const FIELDS = [
  ["idea", "What are you building?", "Describe the idea in one or two sentences."],
  ["problem", "What problem does it solve?", "Who experiences this problem and why does it matter now?"],
  ["solution", "How does it work?", "Explain the product or service and its core outcome."],
  ["customer", "Who will pay first?", "Name your first customer segment, not everyone."],
  ["location", "Where will you launch?", "City, country, or market you understand best."],
];

export default function FounderIntakePage() {
  const navigate = useNavigate();
  const { form, setForm, analyze, loading, error } = useFounderFlow();
  const [validationError, setValidationError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setValidationError("");
    try {
      await analyze();
      navigate("/founder/analysis");
    } catch {
      // The hook exposes the user-facing error.
    }
  };

  return (
    <FounderFlowLayout>
      <div className="mb-7 max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Step 1 · Venture brief</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Start with the context you have.</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">Answer five focused questions. You can return and refine this brief as your company becomes clearer.</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#12121a] p-5 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <Bot size={18} className="text-[#f2ca50]" />
          <div><h2 className="font-display text-xl font-semibold text-white">Your venture brief</h2><p className="mt-1 text-xs text-white/45">Be specific. We will use this to create your first build plan.</p></div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {FIELDS.map(([key, label, placeholder]) => (
            <label key={key} className={key === "idea" || key === "problem" || key === "solution" ? "md:col-span-2" : ""}>
              <span className="mb-2 block text-xs font-semibold text-white/75">{label}</span>
              {key === "idea" || key === "problem" || key === "solution" ? (
                <textarea required minLength={10} rows={3} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className="alq-input min-h-24 resize-y" />
              ) : (
                <input required minLength={2} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className="alq-input" />
              )}
            </label>
          ))}
        </div>
        {(error || validationError) && <p className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error || validationError}</p>}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/35">Your brief is saved in this session.</p>
          <button type="submit" disabled={loading} className="alq-submit sm:w-auto sm:px-8" aria-disabled={loading}>
            {loading ? <><Loader2 size={17} className="alq-spinner" /> Preparing analysis...</> : <>Analyze my venture <span aria-hidden="true">→</span></>}
          </button>
        </div>
      </form>
      <div className="mt-5 text-right"><FlowNextLink to="/founder/analysis">View analysis</FlowNextLink></div>
    </FounderFlowLayout>
  );
}
