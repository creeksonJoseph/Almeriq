import { CheckCircle2, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import FounderFlowLayout, { FlowNextLink } from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";

function ResultList({ title, items }) {
  return <section className="rounded-2xl border border-white/10 bg-[#141417] p-5 sm:p-6"><h2 className="font-display text-xl font-semibold text-white">{title}</h2><ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed text-white/65"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#f2ca50]" />{item}</li>)}</ul></section>;
}

export default function FounderAnalysisPage() {
  const { analysis } = useFounderFlow();
  if (!analysis) {
    return <FounderFlowLayout><div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><h1 className="font-display text-2xl font-semibold text-white">Your analysis is waiting</h1><p className="mt-2 text-sm text-white/50">Complete the venture brief first so we can create a useful recommendation.</p><Link to="/founder/intake" className="alq-submit mt-6 sm:mx-auto sm:w-auto sm:px-8">Start venture brief</Link></div></FounderFlowLayout>;
  }
  return <FounderFlowLayout>
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Step 2 · AI analysis</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">A sharper view of the opportunity.</h1></div><Link to="/founder/intake" className="text-xs font-semibold text-white/50 hover:text-white">Edit brief</Link></div>
    <div className="rounded-2xl border border-[#f2ca50]/20 bg-[#141417] p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ca50]"><Lightbulb size={15} /> Recommendation</div><span className="rounded-full bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/45">{analysis.source === "gemini" ? "Gemini assisted" : "Starter analysis"}</span></div><p className="mt-4 max-w-3xl text-base leading-relaxed text-white/75">{analysis.summary}</p><p className="mt-4 text-sm leading-relaxed text-white/55">{analysis.market}</p></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2"><ResultList title="Risks to test early" items={analysis.risks} /><ResultList title="Your focused MVP" items={analysis.mvp} /></div>
    <div className="mt-7 flex justify-end"><FlowNextLink to="/founder/roadmap">Continue to build plan</FlowNextLink></div>
  </FounderFlowLayout>;
}
