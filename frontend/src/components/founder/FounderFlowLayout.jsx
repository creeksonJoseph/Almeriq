import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const STEPS = [
  { path: "/founder/intake", number: "01", label: "Your Idea" },
  { path: "/founder/analysis", number: "02", label: "AI Feedback" },
  { path: "/founder/roadmap", number: "03", label: "Action Plan" },
];

export function FounderFlowGuard({ children }) {
  const { user } = useAuth();
  if (user?.role !== "founder") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-white">Founder studio access required</h1>
        <p className="mt-3 text-sm text-white/55">Choose the founder role in your profile to use this workspace.</p>
        <Link to="/dashboard" className="mt-6 inline-flex rounded-full bg-[#c9a15a] px-5 py-3 text-sm font-semibold text-[#161410]">Back to dashboard</Link>
      </div>
    );
  }
  return children;
}

export default function FounderFlowLayout({ children }) {
  const location = useLocation();
  const currentIndex = Math.max(0, STEPS.findIndex((step) => step.path === location.pathname));
  const firstName = useAuth().user?.full_name?.split(" ")[0] || "Founder";

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ca50]">Founder studio · {firstName}</p>
        </div>
        <nav aria-label="Founder studio progress" className="mb-8 grid grid-cols-3 gap-2 sm:gap-4">
          {STEPS.map((step, index) => {
            const active = index === currentIndex;
            const complete = index < currentIndex;
            return (
              <Link
                key={step.path}
                to={step.path}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors sm:p-4 ${
                  active
                    ? "border-[#f2ca50]/50 bg-[#f2ca50]/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                {complete ? (
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                ) : (
                  <span
                    className={`font-mono text-xs font-bold ${
                      active ? "text-[#f2ca50]" : "text-white/30"
                    }`}
                  >
                    {step.number}
                  </span>
                )}
                <span className={`text-[11px] font-semibold sm:text-xs ${active ? "text-white" : "text-white/45"}`}>
                  {step.label}
                </span>
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </FounderFlowGuard>
  );
}

export function FlowNextLink({ to, children }) {
  return <Link to={to} className="alq-submit sm:w-auto sm:px-8">{children}</Link>;
}
