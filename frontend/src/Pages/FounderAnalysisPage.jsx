import { CheckCircle2, Lightbulb, Copy, Check, AlertCircle, Target, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import FounderFlowLayout, { FlowNextLink } from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";

function ResultList({ title, items, icon: Icon }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141417] p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={18} className="text-[#f2ca50]" />}
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      </div>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-white/70">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f2ca50]/15 text-xs font-bold text-[#f2ca50] mt-0.5">
              {idx + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function FounderAnalysisPage() {
  const navigate = useNavigate();
  const { analysis, ventureId, resetFlow } = useFounderFlow();
  const [copiedId, setCopiedId] = useState(false);

  if (!analysis) {
    return (
      <FounderFlowLayout>
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-white">Your analysis is waiting</h1>
          <p className="mt-2 text-sm text-white/50">Complete the venture brief first so we can create a useful recommendation.</p>
          <Link to="/founder/intake" className="alq-submit mt-6 sm:mx-auto sm:w-auto sm:px-8">Start venture brief</Link>
        </div>
      </FounderFlowLayout>
    );
  }

  const ventureRef = ventureId ? `ALQ-VNT-${String(ventureId).padStart(6, "0")}` : null;

  const handleCopyId = () => {
    if (ventureRef) {
      navigator.clipboard.writeText(ventureRef);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleNewVenture = () => {
    resetFlow();
    navigate("/founder/intake");
  };

  return (
    <FounderFlowLayout>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Step 2 · AI analysis</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">A sharper view of the opportunity.</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/founder/intake" className="text-xs font-semibold text-white/50 hover:text-white">Edit brief</Link>
          <button type="button" onClick={handleNewVenture} className="text-xs font-semibold text-[#f2ca50] hover:text-white">+ New venture</button>
        </div>
      </div>

      {ventureRef && (
        <div className="mb-5 rounded-2xl border border-[#f2ca50]/20 bg-[#f2ca50]/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f2ca50]">Venture Reference</p>
              <p className="mt-1 font-mono text-sm font-semibold text-white">{ventureRef}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f2ca50]/30 bg-[#f2ca50]/10 px-3 py-1.5 text-xs font-semibold text-[#f2ca50] hover:bg-[#f2ca50]/20"
            >
              {copiedId ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedId ? "Copied" : "Copy ID"}</span>
            </button>
          </div>
          <p className="mt-2 text-xs text-white/50">Use this reference to track your venture across Alimeriq. Your analysis is saved to your account.</p>
        </div>
      )}

      {/* Executive Summary */}
      <div className="rounded-2xl border border-[#f2ca50]/20 bg-[#141417] p-5 sm:p-7 mb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-[#f2ca50]" />
            <h2 className="font-display text-lg font-semibold text-white">Executive Summary</h2>
          </div>
          <span className="rounded-full bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/45">
            {analysis.source === "gemini" ? "Gemini assisted" : "Starter analysis"}
          </span>
        </div>
        <p className="text-base leading-relaxed text-white/75">{analysis.summary}</p>
      </div>

      {/* Market & Validation */}
      <div className="rounded-2xl border border-white/10 bg-[#141417] p-5 sm:p-7 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-[#f2ca50]" />
          <h2 className="font-display text-lg font-semibold text-white">Market & Validation Strategy</h2>
        </div>
        <p className="text-sm leading-relaxed text-white/70">{analysis.market}</p>
      </div>

      {/* Risks and MVP */}
      <div className="grid gap-5 lg:grid-cols-2 mb-5">
        <ResultList title="Critical Risks" items={analysis.risks} icon={AlertCircle} />
        <ResultList title="MVP Priorities" items={analysis.mvp} icon={Zap} />
      </div>

      {/* Roadmap and Next Steps */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ResultList title="90-Day Roadmap" items={analysis.roadmap} />
        <ResultList title="Immediate Next Steps" items={analysis.next_steps} />
      </div>

      <div className="mt-7 flex justify-end">
        <FlowNextLink to="/founder/roadmap">Continue to build plan</FlowNextLink>
      </div>
    </FounderFlowLayout>
  );
}
