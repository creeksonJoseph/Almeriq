import { Link, useNavigate } from "react-router-dom";
import FounderFlowLayout from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";
import { EditorialSection, TimelineFlow } from "../components/ui/BorderlessPrimitives";

export default function FounderRoadmapPage() {
  const navigate = useNavigate();
  const { analysis, resetFlow } = useFounderFlow();

  if (!analysis) {
    return (
      <FounderFlowLayout>
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-white">Action plan not ready yet</h1>
          <p className="mt-2 text-sm text-white/50">Run an AI analysis first so we can create your action plan.</p>
          <Link to="/founder/intake" className="alq-submit mt-6 sm:mx-auto sm:w-auto sm:px-8">Share your idea</Link>
        </div>
      </FounderFlowLayout>
    );
  }

  const handleNewVenture = () => {
    resetFlow();
    navigate("/founder/intake");
  };

  const roadmapSteps = (analysis.roadmap || []).map((step, idx) => ({
    phase: `Step ${idx + 1}`,
    title: typeof step === "string" ? step : step.title || `Milestone ${idx + 1}`,
    description: typeof step === "object" ? step.description : null,
    active: idx === 0,
  }));

  return (
    <FounderFlowLayout>
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Step 3 · Action plan</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your step-by-step action plan.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">Use these clear steps to start building and testing your idea.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <EditorialSection title="Immediate Execution Roadmap" badge={`${roadmapSteps.length} Steps`}>
          <TimelineFlow steps={roadmapSteps} />
        </EditorialSection>

        <EditorialSection title="Helpful Guidance & Strategic Tips">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
            {(analysis.next_steps || []).map((tip, index) => (
              <div key={index} className="p-4 sm:p-5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f2ca50]/15 text-xs font-bold text-[#f2ca50] mt-0.5">
                  {index + 1}
                </span>
                <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                  {typeof tip === "object" ? JSON.stringify(tip) : tip}
                </p>
              </div>
            ))}
          </div>
        </EditorialSection>
      </div>

      <div className="mt-7 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={handleNewVenture}
          className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-xs font-semibold text-white/65 hover:text-white"
        >
          New idea
        </button>
        <Link to="/founder/ventures" className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-xs font-semibold text-white/65 hover:text-white">
          View saved ideas
        </Link>
        <Link to="/dashboard" className="alq-submit sm:w-auto sm:px-8">Back to dashboard</Link>
      </div>
    </FounderFlowLayout>
  );
}
