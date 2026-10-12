import { CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import FounderFlowLayout from "../components/founder/FounderFlowLayout";
import { useFounderFlow } from "../hooks/useFounderFlow";

function PlanSection({ title, items }) {
  return <section className="rounded-2xl border border-white/10 bg-[#141417] p-5 sm:p-7"><h2 className="font-display text-xl font-semibold text-white">{title}</h2><div className="mt-5 space-y-3">{items.map((item, index) => <div key={item} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 text-sm leading-relaxed text-white/65"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2ca50]/15 text-xs font-bold text-[#f2ca50]">{index + 1}</span>{item}</div>)}</div></section>;
}

export default function FounderRoadmapPage() {
  const { analysis } = useFounderFlow();
  if (!analysis) return <FounderFlowLayout><div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><h1 className="font-display text-2xl font-semibold text-white">Build plan unavailable</h1><p className="mt-2 text-sm text-white/50">Generate an analysis before opening the execution plan.</p><Link to="/founder/intake" className="alq-submit mt-6 sm:mx-auto sm:w-auto sm:px-8">Start venture brief</Link></div></FounderFlowLayout>;
  return <FounderFlowLayout><div className="mb-7"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">Step 3 · Build plan</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Turn the recommendation into motion.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">Use this as your first operating plan. Re-run the analysis whenever your customer evidence changes.</p></div><div className="grid gap-5 lg:grid-cols-2"><PlanSection title="Execution roadmap" items={analysis.roadmap} /><PlanSection title="Next best actions" items={analysis.next_steps} /></div><div className="mt-7 flex flex-wrap justify-end gap-3"><Link to="/founder/analysis" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs font-semibold text-white/65 hover:text-white"><RotateCcw size={15} /> Review analysis</Link><Link to="/dashboard" className="alq-submit sm:w-auto sm:px-8">Back to dashboard <CheckCircle2 size={17} /></Link></div></FounderFlowLayout>;
}
