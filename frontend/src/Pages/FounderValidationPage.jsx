/**
 * Pages/FounderValidationPage.jsx - Clean Editorial AI Idea Validation Studio.
 *
 * Minimalist, production-grade layout without nested card soup, rainbow colors,
 * or icon bloat. Features an inline dropdown to switch between saved ideas instantly.
 */
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, ChevronUp, ArrowUpRight } from "lucide-react";
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

        {/* ── Active Target Idea Context Card ── */}
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-[#121217] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Meta Tags: Location & Target Segment */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-[#C9A15A]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8D6A8] border border-[#C9A15A]/25">
                  Target Idea
                </span>
                {locationInput && (
                  <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/60 border border-white/[0.06]">
                    📍 {locationInput}
                  </span>
                )}
                {customerInput && (
                  <span
                    className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/60 border border-white/[0.06] max-w-sm sm:max-w-md truncate"
                    title={customerInput}
                  >
                    👥 {customerInput}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-semibold text-white leading-snug">
                {ideaInput || activeVenture?.idea || "No idea selected yet"}
              </h2>

              {/* Problem / Solution preview if available */}
              {(problemInput || solutionInput) && (
                <p className="mt-1.5 text-xs text-white/50 line-clamp-2 max-w-3xl leading-relaxed">
                  {problemInput || solutionInput}
                </p>
              )}
            </div>

            {/* Actions: Switch Idea + Edit Inputs */}
            <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 hover:bg-white/[0.05] transition-colors">
                <ActiveIdeaDropdown variant="switcher" />
              </div>
              <button
                type="button"
                onClick={() => setShowInputDrawer((prev) => !prev)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>{showInputDrawer ? "Hide Inputs" : "Edit Inputs"}</span>
                {showInputDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* Spacious Input Editor Drawer */}
          {showInputDrawer && (
            <div className="mt-5 pt-5 border-t border-white/[0.08]">
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
            </div>
          )}
        </div>

        {/* ── Loading State ── */}
        {evaluating && (
          <div className="py-20 text-center rounded-2xl border border-white/[0.08] bg-[#121217] p-8">
            <Loader2 size={26} className="animate-spin mx-auto text-[#c9a15a]" />
            <p className="mt-4 text-base font-semibold text-white">
              Evaluating Validation Rubric with AI…
            </p>
            <p className="mt-1.5 text-xs text-white/50 max-w-md mx-auto leading-relaxed">
              Evaluating problem-solution fit, calculating TAM/SAM/SOM sizing, checking competition, scoring feasibility, and auditing unit economics.
            </p>
          </div>
        )}

        {/* ── Visual Hierarchy Empty / Blueprint State ── */}
        {!evaluating && !evaluation && (
          <div className="space-y-6">
            {/* Primary Action Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#16161d] via-[#121217] to-[#0d0d12] p-6 sm:p-8 shadow-xl">
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-2 w-2 rounded-full bg-[#C9A15A] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A15A]">
                    Institutional Rubric
                  </span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-white sm:text-3xl tracking-tight">
                  Validate &ldquo;{ideaInput ? ideaInput.slice(0, 36) + (ideaInput.length > 36 ? "…" : "") : "Your Idea"}&rdquo;
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-white/60 leading-relaxed">
                  Evaluate customer urgency, calculate addressable market size, discover hidden competitors, and audit technical feasibility before writing code.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleRunValidation(e, false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] px-5 py-2.5 text-xs font-semibold text-[#141416] hover:opacity-95 transition-all shadow-md cursor-pointer"
                  >
                    <span>Run Validation Report</span>
                    <ArrowUpRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInputDrawer(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Edit Idea Inputs</span>
                  </button>
                </div>
              </div>

              {/* Subtle ambient decorative gradient */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#C9A15A]/5 blur-3xl" />
            </div>

            {/* 6-Dimension Architectural Preview Grid */}
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">
                  6-Dimension Evaluation Framework
                </h4>
                <span className="text-[11px] text-white/35">Pending evaluation</span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Problem & Solution",
                    desc: "Severity of customer pain point, urgency to solve, and defensibility of the proposed fix.",
                    badge: "Dimension 01",
                  },
                  {
                    title: "Market Size (TAM/SAM/SOM)",
                    desc: "Total Addressable Market, Serviceable Available Market, and Obtainable Service Volume calculations.",
                    badge: "Dimension 02",
                  },
                  {
                    title: "Customer Demand & Pull",
                    desc: "Willingness to pay, adoption friction, and organic conversion signals.",
                    badge: "Dimension 03",
                  },
                  {
                    title: "Competition & Moats",
                    desc: "Active competitors, legacy alternatives, switching cost barriers, and proprietary advantages.",
                    badge: "Dimension 04",
                  },
                  {
                    title: "Feasibility Analysis",
                    desc: "Technical architecture complexity, regulatory & licensing barriers, and operational prerequisites.",
                    badge: "Dimension 05",
                  },
                  {
                    title: "Business Model & Margins",
                    desc: "Monetization model, unit economics, gross margins, and scalability runway.",
                    badge: "Dimension 06",
                  },
                ].map((item) => (
                  <div
                    key={item.badge}
                    className="rounded-xl border border-white/[0.06] bg-[#121217] p-4.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A15A]/70">
                          {item.badge}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                      </div>
                      <h5 className="font-semibold text-xs sm:text-sm text-white">
                        {item.title}
                      </h5>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
