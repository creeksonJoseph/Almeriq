/**
 * Pages/FounderValidationPage.jsx - Clean Editorial AI Idea Validation Studio.
 *
 * Minimalist, production-grade layout without nested card soup, rainbow colors,
 * or icon bloat. Features an inline dropdown to switch between saved ideas instantly.
 */
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import ActiveIdeaDropdown from "../components/ActiveIdeaDropdown";
import ValidationInputDrawer from "../components/founder/validation/ValidationInputDrawer";
import ExecutiveDiagnosis from "../components/founder/validation/ExecutiveDiagnosis";
import ValidationRubricList from "../components/founder/validation/ValidationRubricList";
import { executeAiToolApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { useActiveIdea } from "../context/IdeaContext";
import { useFounderFlow } from "../hooks/useFounderFlow";

export default function FounderValidationPage() {
  const { showToast } = useToast();
  const { activeVenture, activeVentureId } = useActiveIdea();
  const { form: flowForm, analysis: flowAnalysis } = useFounderFlow();

  // Inputs state
  const [ideaInput, setIdeaInput] = useState("");
  const [problemInput, setProblemInput] = useState("");
  const [solutionInput, setSolutionInput] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [showInputDrawer, setShowInputDrawer] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  // Sync inputs on activeVenture or flowForm update
  useEffect(() => {
    const candidateIdea = activeVenture?.idea || flowForm.idea || "";
    const candidateProblem = activeVenture?.problem || flowForm.problem || "";
    const candidateSolution = activeVenture?.solution || flowForm.solution || "";
    const candidateCustomer = activeVenture?.customer || flowForm.customer || "";
    const candidateLocation = activeVenture?.location || flowForm.location || "";

    if (candidateIdea) setIdeaInput(candidateIdea);
    if (candidateProblem) setProblemInput(candidateProblem);
    if (candidateSolution) setSolutionInput(candidateSolution);
    if (candidateCustomer) setCustomerInput(candidateCustomer);
    if (candidateLocation) setLocationInput(candidateLocation);
  }, [activeVenture, flowForm]);

  // Load cached evaluation on venture switch
  useEffect(() => {
    const ventureKey = activeVentureId || activeVenture?.id || "draft";
    const cacheKey = `almeriq_validation_eval_${ventureKey}`;
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        setEvaluation(JSON.parse(stored));
      } else {
        setEvaluation(null);
      }
    } catch {
      // ignore
    }
  }, [activeVentureId, activeVenture?.id]);

  // Execute AI Idea Validation
  const handleRunValidation = async (e, forceRefresh = false) => {
    if (e) e.preventDefault();
    const effectiveIdea = ideaInput.trim() || activeVenture?.idea || flowForm.idea;
    if (!effectiveIdea) {
      showToast("Please provide or select an idea to evaluate.", "error");
      return;
    }

    setEvaluating(true);
    try {
      const extraParams = {
        refresh: forceRefresh,
        summary: activeVenture?.summary || flowAnalysis?.summary || "",
        market: activeVenture?.market || flowAnalysis?.market || "",
        risks: activeVenture?.risks || flowAnalysis?.risks || [],
        mvp: activeVenture?.mvp || flowAnalysis?.mvp || [],
        problem: problemInput || activeVenture?.problem || flowForm.problem || "",
        solution: solutionInput || activeVenture?.solution || flowForm.solution || "",
      };

      const payload = {
        tool_key: "idea_validation",
        idea: effectiveIdea,
        problem: problemInput || activeVenture?.problem || flowForm.problem || "",
        solution: solutionInput || activeVenture?.solution || flowForm.solution || "",
        customer: customerInput || activeVenture?.customer || flowForm.customer || "General Market",
        location: locationInput || activeVenture?.location || flowForm.location || "Global Market",
        venture_id: activeVentureId || activeVenture?.id,
        extra_params: extraParams,
      };

      const res = await executeAiToolApi(payload);
      if (res?.result) {
        setEvaluation(res.result);
        const ventureKey = activeVentureId || activeVenture?.id || "draft";
        try {
          localStorage.setItem(`almeriq_validation_eval_${ventureKey}`, JSON.stringify(res.result));
        } catch {
          // ignore
        }
        showToast("Idea validation completed successfully.", "success");
      } else {
        throw new Error("Unable to parse validation results");
      }
    } catch (err) {
      showToast(err.message || "Validation failed. Please try again.", "error");
    } finally {
      setEvaluating(false);
    }
  };

  // Copy full evaluation
  const handleCopyReport = () => {
    if (!evaluation) return;
    const effectiveIdea = ideaInput || activeVenture?.idea || "Startup Idea";
    let text = `# AI Idea Validation Report: ${effectiveIdea}\n`;
    text += `Overall Score: ${evaluation.overall_score || 0}/100 (${evaluation.overall_rating || "Evaluated"})\n\n`;
    text += `## Executive Verdict\n${evaluation.executive_summary || ""}\n\n`;

    if (evaluation.rubric) {
      Object.entries(evaluation.rubric).forEach(([key, sec]) => {
        const title = key.replace(/_/g, " ").toUpperCase();
        text += `### ${title} — Rating: ${sec.rating}\n`;
        text += `${sec.assessment || ""}\n\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Report copied to clipboard.", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const rubricList = useMemo(() => {
    if (!evaluation?.rubric) return [];
    const entries = [
      { key: "problem_and_solution", title: "Problem & Solution", data: evaluation.rubric.problem_and_solution },
      { key: "market_size", title: "Market Size (TAM, SAM, SOM)", data: evaluation.rubric.market_size },
      { key: "demand", title: "Demand & User Pull", data: evaluation.rubric.demand },
      { key: "competition", title: "Competition & Defensibility", data: evaluation.rubric.competition },
      { key: "feasibility", title: "Feasibilities (Tech, Regulatory & Resource)", data: evaluation.rubric.feasibility },
      { key: "business_model", title: "Business Model & Monetization", data: evaluation.rubric.business_model },
    ].filter((item) => Boolean(item.data));

    if (activeFilter === "all") return entries;
    return entries.filter((item) => (item.data.rating || "").toLowerCase() === activeFilter.toLowerCase());
  }, [evaluation, activeFilter]);

  const ratingCounts = useMemo(() => {
    if (!evaluation?.rubric) return { strong: 0, vague: 0, weak: 0 };
    let strong = 0;
    let vague = 0;
    let weak = 0;
    Object.values(evaluation.rubric).forEach((sec) => {
      const r = (sec?.rating || "").toLowerCase();
      if (r === "strong") strong++;
      else if (r === "vague") vague++;
      else if (r === "weak") weak++;
    });
    return { strong, vague, weak };
  }, [evaluation]);

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Idea Validation"
          subtitle="Comprehensive evaluation across problem/solution, TAM/SAM/SOM, demand, competition, feasibility, and business model."
          action={
            <div className="flex items-center gap-2">
              {evaluation && (
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                  title="Copy full evaluation report"
                >
                  {copied ? "Copied" : "Copy Report"}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleRunValidation(e, Boolean(evaluation))}
                disabled={evaluating}
                className="alq-submit sm:px-5"
              >
                {evaluating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Evaluating…</span>
                  </>
                ) : (
                  <span>{evaluation ? "Re-evaluate" : "Run Validation"}</span>
                )}
              </button>
            </div>
          }
        />

        {/* ── Active Idea Header & Switcher (No card boxing) ── */}
        <div className="mb-8 border-b border-white/10 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs text-white/45">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-white/40">
                  Target Idea
                </span>
                {customerInput && <span>· {customerInput}</span>}
                {locationInput && <span className="capitalize">· {locationInput}</span>}
              </div>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-white truncate">
                {ideaInput || activeVenture?.idea || "No idea selected yet"}
              </h2>
            </div>

            {/* Inline Dropdown Switcher + Input Toggle */}
            <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
              <ActiveIdeaDropdown variant="switcher" />
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={() => setShowInputDrawer((prev) => !prev)}
                className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <span>{showInputDrawer ? "Hide Inputs" : "Edit Inputs"}</span>
                {showInputDrawer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Spacious Input Editor Drawer */}
          {showInputDrawer && (
            <ValidationInputDrawer
              ideaInput={ideaInput}
              setIdeaInput={setIdeaInput}
              problemInput={problemInput}
              setProblemInput={setProblemInput}
              solutionInput={solutionInput}
              setSolutionInput={setSolutionInput}
              customerInput={customerInput}
              setCustomerInput={setCustomerInput}
              locationInput={locationInput}
              setLocationInput={setLocationInput}
              onCancel={() => setShowInputDrawer(false)}
              onSubmit={(e) => handleRunValidation(e, true)}
              evaluating={evaluating}
            />
          )}
        </div>

        {/* ── Loading State ── */}
        {evaluating && (
          <div className="py-16 text-center">
            <Loader2 size={24} className="animate-spin mx-auto text-[#c9a15a]" />
            <p className="mt-4 text-sm font-semibold text-white">
              Evaluating Validation Rubric…
            </p>
            <p className="mt-1 text-xs text-white/50 max-w-sm mx-auto">
              Analyzing problem-solution fit, TAM/SAM/SOM sizing, market competitors, feasibility, and unit economics.
            </p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!evaluating && !evaluation && (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl p-8">
            <h3 className="font-display text-lg font-semibold text-white">
              No validation report yet
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-white/55 max-w-md mx-auto leading-relaxed">
              Use &ldquo;Run Validation&rdquo; at the top to evaluate this idea against venture standards across problem/solution fit, TAM/SAM/SOM, demand, competition, and unit economics.
            </p>
          </div>
        )}

        {/* ── Evaluated Report (Modular Layout) ── */}
        {!evaluating && evaluation && (
          <div className="space-y-10">
            <ExecutiveDiagnosis
              evaluation={evaluation}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              ratingCounts={ratingCounts}
            />
            <ValidationRubricList rubricList={rubricList} />
          </div>
        )}
      </div>
    </FounderFlowGuard>
  );
}
