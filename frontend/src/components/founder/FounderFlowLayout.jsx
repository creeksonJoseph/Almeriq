import { ArrowLeft, BookOpen, CheckCircle2, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useFounderFlow } from "../../hooks/useFounderFlow";
import { useActiveIdea } from "../../context/IdeaContext";

const STEPS = [
  { path: "/founder/intake", number: "01", label: "Your Idea" },
  { path: "/founder/analysis", number: "02", label: "Feedback & Strategy" },
];

export function FounderFlowGuard({ children }) {
  const { user } = useAuth();
  if (user?.role !== "founder") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-white">Founder access required</h1>
        <p className="mt-3 text-sm text-white/55">Choose the founder role in your profile to use this workspace.</p>
        <Link to="/dashboard" className="mt-6 inline-flex rounded-full bg-[#c9a15a] px-5 py-3 text-sm font-semibold text-[#161410]">Back to dashboard</Link>
      </div>
    );
  }
  return children;
}

export default function FounderFlowLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { form, resetFlow } = useFounderFlow();
  const { activeVenture } = useActiveIdea();
  const currentIndex = Math.max(0, STEPS.findIndex((step) => step.path === location.pathname));
  const firstName = useAuth().user?.full_name?.split(" ")[0] || "Founder";

  const effectiveProject = (activeVenture && activeVenture.idea) ? activeVenture : form;
  const isProjectWorkspace = location.pathname === "/founder/analysis" && Boolean(effectiveProject?.idea);

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {isProjectWorkspace ? (
          <div className="mb-6 sm:mb-8 border-b sm:border border-white/10 bg-transparent sm:bg-white/[0.02] pb-4 sm:p-5 sm:rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center rounded-md bg-[#f2ca50]/10 border border-[#f2ca50]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#f2ca50]">
                    Active Project
                  </span>
                  {effectiveProject.customer && (
                    <span className="text-[11px] text-white truncate max-w-xs">
                      · {effectiveProject.customer}
                    </span>
                  )}
                  {effectiveProject.location && (
                    <span className="text-[11px] text-white capitalize">
                      · {effectiveProject.location}
                    </span>
                  )}
                </div>
                <h1 className="font-display text-base sm:text-xl font-semibold text-white truncate" title={effectiveProject.idea}>
                  {effectiveProject.idea}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <Link
                  to="/founder/ventures"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  <BookOpen size={13} />
                  <span>Saved Ideas</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    resetFlow();
                    navigate("/founder/intake?mode=new");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/45 hover:border-[#f2ca50]/30 hover:text-[#f2ca50] transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>New Idea</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <nav aria-label="Founder studio progress" className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 max-w-xl">
            {STEPS.map((step, index) => {
              const active = index === currentIndex;
              const complete = index < currentIndex;
              const stepTarget = step.path === "/founder/intake"
                ? (effectiveProject?.idea ? "/founder/intake?mode=edit" : "/founder/intake?mode=new")
                : step.path;
              return (
                <Link
                  key={step.path}
                  to={stepTarget}
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
        )}
        {children}
      </div>
    </FounderFlowGuard>
  );
}

export function FlowNextLink({ to, children }) {
  return <Link to={to} className="alq-submit sm:w-auto sm:px-8">{children}</Link>;
}
