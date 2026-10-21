/**
 * Pages/FounderValidationPage.jsx - Clean Editorial AI Idea Validation Studio.
 *
 * Minimalist, production-grade layout without nested card soup, rainbow colors,
 * or icon bloat. Features an inline dropdown to switch between saved ideas instantly.
 */
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import ActiveIdeaDropdown from "../components/ActiveIdeaDropdown";
import { executeAiToolApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { useActiveIdea } from "../context/IdeaContext";
import { useFounderFlow } from "../hooks/useFounderFlow";

function MetricBadge({ rating }) {
  const r = (rating || "").toLowerCase();
  if (r === "strong") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
        Strong
      </span>
    );
  }
  if (r === "vague") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
        Vague
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
      Weak
    </span>
  );
}

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
    const cacheKey = `alimeriq_validation_eval_${ventureKey}`;
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
          localStorage.setItem(`alimeriq_validation_eval_${ventureKey}`, JSON.stringify(res.result));
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
            <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/75 block mb-1.5">
                  Startup Idea / Headline *
                </label>
                <input
                  type="text"
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  placeholder="e.g. B2B inventory reconciliation platform for mid-market logistics"
                  className="alq-input w-full text-sm py-3 px-4"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/75 block mb-1.5">
                  Problem Statement
                </label>
                <textarea
                  rows={3}
                  value={problemInput}
                  onChange={(e) => setProblemInput(e.target.value)}
                  placeholder="What is the acute pain, friction, or cost experienced by users?"
                  className="alq-input w-full min-h-28 text-sm py-3 px-4 resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/75 block mb-1.5">
                  Proposed Solution
                </label>
                <textarea
                  rows={3}
                  value={solutionInput}
                  onChange={(e) => setSolutionInput(e.target.value)}
                  placeholder="How does your product directly and uniquely solve this problem?"
                  className="alq-input w-full min-h-28 text-sm py-3 px-4 resize-y leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/75 block mb-1.5">
                    Target Customer
                  </label>
                  <input
                    type="text"
                    value={customerInput}
                    onChange={(e) => setCustomerInput(e.target.value)}
                    placeholder="e.g. Warehouse managers & 3PL operators"
                    className="alq-input w-full text-sm py-2.5 px-4"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/75 block mb-1.5">
                    Market Location / Geography
                  </label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="e.g. North America / Kenya / Global"
                    className="alq-input w-full text-sm py-2.5 px-4"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInputDrawer(false)}
                  className="px-4 py-2 text-xs font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRunValidation(e, true)}
                  disabled={evaluating}
                  className="alq-submit text-xs sm:text-sm px-6 py-2.5"
                >
                  {evaluating ? "Evaluating..." : "Save & Evaluate"}
                </button>
              </div>
            </div>
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

        {/* ── Evaluated Report (Clean Editorial Layout) ── */}
        {!evaluating && evaluation && (
          <div className="space-y-10">
            {/* Executive Diagnosis Section */}
            <section className="pb-8 border-b border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
                    {evaluation.overall_score || 0}
                  </span>
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    / 100 Score
                  </span>
                  <MetricBadge rating={evaluation.overall_rating} />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveFilter(activeFilter === "strong" ? "all" : "strong")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeFilter === "strong"
                        ? "bg-emerald-500/20 text-emerald-300 font-medium"
                        : "text-emerald-400/80 hover:bg-emerald-500/10"
                    }`}
                  >
                    {ratingCounts.strong} Strong
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter(activeFilter === "vague" ? "all" : "vague")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeFilter === "vague"
                        ? "bg-amber-500/20 text-amber-300 font-medium"
                        : "text-amber-400/80 hover:bg-amber-500/10"
                    }`}
                  >
                    {ratingCounts.vague} Vague
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter(activeFilter === "weak" ? "all" : "weak")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeFilter === "weak"
                        ? "bg-rose-500/20 text-rose-300 font-medium"
                        : "text-rose-400/80 hover:bg-rose-500/10"
                    }`}
                  >
                    {ratingCounts.weak} Weak
                  </button>
                </div>
              </div>

              {evaluation.executive_summary && (
                <p className="text-sm leading-relaxed text-white/80 max-w-5xl">
                  {evaluation.executive_summary}
                </p>
              )}

              {/* Strengths & Red Flags 2-column text list */}
              <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {evaluation.top_strengths?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 mb-2">
                      Key Strengths
                    </h4>
                    <ul className="space-y-1.5 text-white/75">
                      {evaluation.top_strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400/70 font-semibold">•</span>
                          <span className="leading-relaxed">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.critical_red_flags?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-400/90 mb-2">
                      Critical Blindspots & Risks
                    </h4>
                    <ul className="space-y-1.5 text-white/75">
                      {evaluation.critical_red_flags.map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-400/70 font-semibold">•</span>
                          <span className="leading-relaxed">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Immediate Action Plan */}
              {evaluation.immediate_action_plan?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/5 text-xs">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-3">
                    Immediate Action Plan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/80">
                    {evaluation.immediate_action_plan.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-mono text-white/40 shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── 6 Rubric Sections (Separated by subtle lines, not boxed cards) ── */}
            <div className="space-y-12">
              {rubricList.map(({ key, title, data }, sectionIndex) => (
                <section key={key} className="border-b border-white/10 pb-10">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="font-display text-base sm:text-lg font-semibold text-white">
                      {sectionIndex + 1}. {title}
                    </h3>
                    <MetricBadge rating={data.rating} />
                  </div>

                  {data.assessment && (
                    <p className="text-xs sm:text-sm leading-relaxed text-white/80 mb-5">
                      {data.assessment}
                    </p>
                  )}

                  {/* 1. Problem & Solution Specifics */}
                  {key === "problem_and_solution" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                      {data.problem_clarity && (
                        <div>
                          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
                            Problem Urgency
                          </span>
                          <p className="text-white/75 leading-relaxed">{data.problem_clarity}</p>
                        </div>
                      )}
                      {data.solution_fit && (
                        <div>
                          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
                            Solution Fit
                          </span>
                          <p className="text-white/75 leading-relaxed">{data.solution_fit}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Market Sizing (Clean Minimalist 3-column metric strip) */}
                  {key === "market_size" && (
                    <div className="space-y-4 mb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1 pb-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                            TAM (Total Addressable)
                          </span>
                          <div className="font-display text-xl sm:text-2xl font-bold text-white mt-1 mb-1">
                            {data.tam?.value || "N/A"}
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed">
                            {data.tam?.description}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                            SAM (Serviceable Available)
                          </span>
                          <div className="font-display text-xl sm:text-2xl font-bold text-white mt-1 mb-1">
                            {data.sam?.value || "N/A"}
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed">
                            {data.sam?.description}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                            SOM (Serviceable Obtainable)
                          </span>
                          <div className="font-display text-xl sm:text-2xl font-bold text-white mt-1 mb-1">
                            {data.som?.value || "N/A"}
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed">
                            {data.som?.description}
                          </p>
                        </div>
                      </div>

                      {data.sizing_rationale && (
                        <p className="text-xs text-white/65 leading-relaxed border-t border-white/5 pt-3">
                          <strong className="text-white/80">Methodology: </strong>
                          {data.sizing_rationale}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. Demand Signals & Experiments */}
                  {key === "demand" && (
                    <div className="space-y-4 mb-4 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-white/70">
                        {data.urgency_level && (
                          <div>
                            <span className="text-white/40">Need Urgency: </span>
                            <span className="font-medium text-white">{data.urgency_level}</span>
                          </div>
                        )}
                        {data.willingness_to_pay && (
                          <div>
                            <span className="text-white/40">Willingness to Pay: </span>
                            <span className="font-medium text-white">{data.willingness_to_pay}</span>
                          </div>
                        )}
                      </div>

                      {data.demand_signals && (
                        <p className="text-white/75 leading-relaxed">
                          {data.demand_signals}
                        </p>
                      )}

                      {data.validation_experiments?.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-2">
                            Validation Experiments to Run Before Coding
                          </span>
                          <ol className="space-y-1.5 text-white/75">
                            {data.validation_experiments.map((exp, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="font-mono text-white/40 shrink-0">{idx + 1}.</span>
                                <span className="leading-relaxed">{exp}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Competition & Defensibility */}
                  {key === "competition" && (
                    <div className="space-y-4 mb-4 text-xs">
                      {data.landscape_summary && (
                        <p className="text-white/75 leading-relaxed">
                          {data.landscape_summary}
                        </p>
                      )}

                      {data.identified_competitors?.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                            Identified Competitors
                          </span>
                          <div className="divide-y divide-white/5 border-t border-b border-white/5">
                            {data.identified_competitors.map((comp, idx) => (
                              <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                                <div className="min-w-0 sm:w-1/3">
                                  <span className="font-semibold text-white">{comp.name}</span>
                                  <span className="text-[10px] text-white/40 ml-2">({comp.type || "Direct"})</span>
                                </div>
                                <div className="sm:w-2/3 text-white/65 space-y-0.5 text-[11px]">
                                  {comp.strengths && <div><span className="text-white/40">Advantage:</span> {comp.strengths}</div>}
                                  {comp.differentiation_angle && (
                                    <div className="text-white/80"><span className="text-white/40">How We Win:</span> {comp.differentiation_angle}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.moat_assessment && (
                        <p className="text-white/75 leading-relaxed pt-1">
                          <strong className="text-white/90">Defensibility Moats: </strong>
                          {data.moat_assessment}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 5. Feasibilities */}
                  {key === "feasibility" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4 text-xs">
                      {data.technical && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-white">Technical</span>
                            <MetricBadge rating={data.technical.rating} />
                          </div>
                          <p className="text-white/65 leading-relaxed text-[11px]">
                            {data.technical.assessment}
                          </p>
                        </div>
                      )}

                      {data.operational_regulatory && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-white">Regulatory & Ops</span>
                            <MetricBadge rating={data.operational_regulatory.rating} />
                          </div>
                          <p className="text-white/65 leading-relaxed text-[11px]">
                            {data.operational_regulatory.assessment}
                          </p>
                        </div>
                      )}

                      {data.economic && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-white">Economic & Runway</span>
                            <MetricBadge rating={data.economic.rating} />
                          </div>
                          <p className="text-white/65 leading-relaxed text-[11px]">
                            {data.economic.assessment}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Business Model */}
                  {key === "business_model" && (
                    <div className="space-y-4 mb-4 text-xs">
                      {data.revenue_streams?.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-2">
                            Revenue Streams
                          </span>
                          <div className="space-y-1.5">
                            {data.revenue_streams.map((rev, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 text-white/75">
                                <span className="font-medium text-white">{rev.stream}:</span>
                                <span>{rev.pricing_model || rev.rationale}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.pricing_strategy && (
                        <p className="text-white/75 leading-relaxed">
                          <strong className="text-white/90">Pricing Logic: </strong>
                          {data.pricing_strategy}
                        </p>
                      )}

                      {data.unit_economics && (
                        <div className="flex flex-wrap items-center gap-6 text-white/70 pt-2 border-t border-white/5">
                          {data.unit_economics.cac_outlook && (
                            <div>
                              <span className="text-white/40 text-[10px] block uppercase">Est. CAC</span>
                              <span className="font-medium text-white">{data.unit_economics.cac_outlook}</span>
                            </div>
                          )}
                          {data.unit_economics.ltv_outlook && (
                            <div>
                              <span className="text-white/40 text-[10px] block uppercase">Est. LTV</span>
                              <span className="font-medium text-white">{data.unit_economics.ltv_outlook}</span>
                            </div>
                          )}
                          {data.unit_economics.margin_potential && (
                            <div>
                              <span className="text-white/40 text-[10px] block uppercase">Gross Margin</span>
                              <span className="font-medium text-white">{data.unit_economics.margin_potential}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommendations */}
                  {data.recommendations?.length > 0 && (
                    <div className="pt-2 text-xs text-white/70">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-1.5">
                        Recommendations
                      </span>
                      <ul className="space-y-1">
                        {data.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-white/30">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </FounderFlowGuard>
  );
}
