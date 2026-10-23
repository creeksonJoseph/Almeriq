import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, X, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FounderFlowLayout from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";
import { useActiveIdea } from "../context/IdeaContext";
import { useToast } from "../context/ToastContext";
import { saveBriefApi } from "../lib/api";

const FIELDS = [
  ["name", "Startup / Idea Name", "e.g. Almeriq, Stripe, Airbnb, FarmDirect", 100],
  ["idea", "What are you building?", "Describe the product, platform, or service in one or two sentences.", 500],
  ["problem", "What problem does it solve?", "Who experiences this problem and why does it matter now?", 500],
  ["solution", "How does it work?", "Explain the product or service and its core outcome.", 500],
  ["customer", "Who will pay first?", "Name your first customer segment, not everyone.", 200],
  ["location", "Where will you launch?", "City, country, or market you understand best.", 200],
];

const BLANK_FORM = {
  name: "",
  idea: "",
  problem: "",
  solution: "",
  customer: "",
  location: "",
};

export default function FounderIntakePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeVenture, ventures, setActiveVentureId, refreshVentures } = useActiveIdea();
  const { setForm: syncFlowForm, setVentureId: syncFlowVentureId } = useFounderFlow();
  const { showToast } = useToast();

  const mode = searchParams.get("mode");
  const targetId = searchParams.get("id");
  const isEditMode = mode === "edit" || searchParams.get("edit") === "true";

  // Target venture for editing (if in edit mode)
  const targetVenture = isEditMode
    ? (targetId ? (ventures?.find((v) => String(v.id) === String(targetId)) || activeVenture) : activeVenture)
    : null;

  // Initialize form state based on mode
  const [form, setForm] = useState(() => {
    if (isEditMode && targetVenture) {
      return {
        name: targetVenture.name || "",
        idea: targetVenture.idea || "",
        problem: targetVenture.problem || "",
        solution: targetVenture.solution || "",
        customer: targetVenture.customer || "",
        location: targetVenture.location || "",
      };
    }
    return { ...BLANK_FORM };
  });

  const [ventureId, setVentureId] = useState(() => {
    return isEditMode && targetVenture ? targetVenture.id : null;
  });

  const [savedFormSnapshot, setSavedFormSnapshot] = useState(() => {
    if (isEditMode && targetVenture) {
      return {
        name: targetVenture.name || "",
        idea: targetVenture.idea || "",
        problem: targetVenture.problem || "",
        solution: targetVenture.solution || "",
        customer: targetVenture.customer || "",
        location: targetVenture.location || "",
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize when mode, targetId, or active venture changes
  useEffect(() => {
    if (isEditMode) {
      const v = targetId
        ? (ventures?.find((item) => String(item.id) === String(targetId)) || activeVenture)
        : activeVenture;
      if (v) {
        const fields = {
          name: v.name || "",
          idea: v.idea || "",
          problem: v.problem || "",
          solution: v.solution || "",
          customer: v.customer || "",
          location: v.location || "",
        };
        setForm(fields);
        setSavedFormSnapshot(fields);
        setVentureId(v.id);
      }
    } else {
      // In new idea mode: strictly blank, clean slate
      setForm({ ...BLANK_FORM });
      setSavedFormSnapshot(null);
      setVentureId(null);
    }
  }, [isEditMode, targetId, activeVenture?.id]);

  const formHasChanged = savedFormSnapshot
    ? FIELDS.some(([key]) => (form[key] || "") !== (savedFormSnapshot[key] || ""))
    : true;

  const submit = async (event) => {
    event.preventDefault();

    // If editing and nothing changed, simply proceed to analysis
    if (isEditMode && ventureId && !formHasChanged) {
      setSaveSuccess(true);
      setTimeout(() => navigate("/founder/analysis"), 400);
      return;
    }

    setLoading(true);
    try {
      const result = await saveBriefApi(form);
      const newVentureId = result.venture_id || ventureId;

      // Update flow and active idea context
      if (syncFlowForm) syncFlowForm(form);
      if (syncFlowVentureId && newVentureId) syncFlowVentureId(newVentureId);
      if (setActiveVentureId && newVentureId) setActiveVentureId(newVentureId);
      if (refreshVentures) await refreshVentures();

      setSavedFormSnapshot({ ...form });
      setSaveSuccess(true);
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">
          {isEditMode ? "Step 1 · Edit your startup brief" : "Step 1 · Share your idea"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {isEditMode ? "Edit your startup idea" : "Tell us about your startup idea."}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white">
          {isEditMode
            ? "Update your 5 questions below. Saving will update your project brief and analysis."
            : "Answer 5 simple questions. We'll save your idea, then you can choose what kind of help you want."}
        </p>
      </div>

      {saveSuccess && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-[#f2ca50]/10 border border-[#f2ca50]/30 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-[#f2ca50] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#f2ca50]">
                {isEditMode ? "Changes saved - opening analysis..." : "Idea saved - opening analysis..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(false)}
            className="text-[#f2ca50] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <form onSubmit={submit} className="rounded-2xl border border-white/10 p-5 sm:p-8">
        <div className="mb-7 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Your startup idea</h2>
            <p className="mt-1 text-xs text-white">
              {isEditMode
                ? `Editing: ${targetVenture?.name || (targetVenture?.idea ? targetVenture.idea.slice(0, 50) + "..." : "Current brief")}`
                : "Be clear and direct. This is used to evaluate and build your plan."}
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {FIELDS.map(([key, label, placeholder, maxLength]) => (
            <label
              key={key}
              className={key === "name" || key === "idea" || key === "problem" || key === "solution" ? "md:col-span-2" : ""}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{label}</span>
                <span
                  className={`text-xs font-medium ${(form[key] || "").length > maxLength * 0.9
                    ? "text-red-400"
                    : (form[key] || "").length > maxLength * 0.75
                      ? "text-yellow-400"
                      : "text-white/45"
                  }`}
                >
                  {(form[key] || "").length}/{maxLength}
                </span>
              </div>
              {key === "idea" || key === "problem" || key === "solution" ? (
                <textarea
                  required
                  minLength={10}
                  maxLength={maxLength}
                  rows={3}
                  value={form[key] || ""}
                  onChange={(e) => setForm((cur) => ({ ...cur, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="alq-input min-h-24 resize-y"
                />
              ) : (
                <input
                  required
                  minLength={2}
                  maxLength={maxLength}
                  value={form[key] || ""}
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
            ) : isEditMode ? (
              !formHasChanged ? (
                <>
                  Continue <ArrowRight size={14} />
                </>
              ) : (
                <>
                  Save Changes <ArrowRight size={14} />
                </>
              )
            ) : (
              <>
                Save & Continue <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </FounderFlowLayout>
  );
}
