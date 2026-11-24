import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  Cpu,
  Boxes,
  Home,
  Scale,
  Search,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const ROLE_DATA = {
  founder: {
    label: "Founder workspace",
    title: "Build with momentum.",
    subtitle: "Turn your next idea into a company people can believe in.",
    icon: Building2,
  },
  investor: {
    label: "Investor workspace",
    title: "Find what is worth backing.",
    subtitle: "A focused view of promising companies, active conversations, and your portfolio.",
    icon: TrendingUp,
  },
  infrastructure: {
    label: "Infrastructure workspace",
    title: "Put your assets to work.",
    subtitle: "Manage listings, requests, and the companies looking for what you provide.",
    icon: Building2,
  },
  job_seeker: {
    label: "Talent workspace",
    title: "Make your next move count.",
    subtitle: "Stay close to roles and teams that match the work you want to do.",
    icon: BriefcaseBusiness,
  },
};

const NAV_ITEMS = [
  ["overview", "Overview", Home],
  ["discover", "Discover", Search],
  ["profile", "Profile", UserRound],
];

import { useActiveIdea } from "../context/IdeaContext";

function FounderWorkspaceOverview() {
  const { ventures, activeVenture } = useActiveIdea();

  const target = activeVenture || (ventures && ventures.length > 0 ? ventures[0] : null);
  const ventureName = target?.name || target?.idea || null;
  const ventureWhatBuilding = target?.name ? target.idea : "";
  const ventureProblem = target?.problem || "";

  return (
    <div className="space-y-10">
      {/* 1. ACTIVE STARTUP IDEA */}
      <div className="pb-8 border-b border-white/10">
        {ventureName ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="max-w-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2ca50]">
                  Active Startup Idea
                </span>
                <h2 className="mt-1.5 font-display text-3xl font-semibold text-white tracking-tight sm:text-4xl">
                  {ventureName}
                </h2>
                {ventureWhatBuilding && (
                  <p className="mt-3 text-base font-medium leading-relaxed text-white">
                    {ventureWhatBuilding}
                  </p>
                )}
                {ventureProblem && (
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {ventureProblem}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
                <Link
                  to="/founder/analysis"
                  className="alq-submit text-xs py-2 px-4"
                >
                  AI Feedback <ArrowRight size={14} />
                </Link>
                <Link
                  to="/founder/intake?mode=edit"
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:text-[#f2ca50] hover:border-white/40 transition-colors"
                >
                  Edit idea
                </Link>
                <Link
                  to="/founder/intake?mode=new"
                  className="rounded-full border border-dashed border-white/20 px-4 py-2 text-xs font-semibold text-white hover:text-[#f2ca50] hover:border-white/40 transition-colors"
                >
                  + New idea
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 px-6 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-transparent">
            <h2 className="font-display text-2xl font-semibold text-white">No startup idea yet</h2>
            <p className="mt-2 text-sm text-white max-w-md">
              Add your startup idea to get AI analysis, market validation, and a build roadmap.
            </p>
            <div className="mt-6 flex w-full">
              <Link to="/founder/intake?mode=new" className="alq-submit text-xs py-2 px-5 w-full">
                + Add your startup idea
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 2. TOOLS */}
      <div className="pb-8 border-b border-white/10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2ca50]">
              Tools
            </h3>
            <p className="mt-1 text-xl font-display font-semibold text-white">
              Founder Toolkit
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "AI Analysis",
              desc: "Market, feasibility, business plan & roadmap.",
              to: "/founder/analysis",
              icon: Cpu,
            },
            {
              title: "Idea Validation",
              desc: "Test customer demand and willingness to pay.",
              to: "/founder/validation",
              icon: CheckCircle2,
            },
            {
              title: "Product Development",
              desc: "Personas, user flows, tech stack & MVP backlog.",
              to: "/founder/product",
              icon: Boxes,
            },
            {
              title: "Legal & Setup",
              desc: "Entity formation, founder agreements & filings.",
              to: "/founder/legal",
              icon: Scale,
            },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.to}
                to={tool.to}
                className="group flex flex-col justify-start py-2 transition-all hover:bg-white/10 hover:backdrop-blur-sm hover:border-white/20 rounded-lg p-4 border border-transparent"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2ca50]/10 text-[#f2ca50]">
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-[#f2ca50] transition-colors">
                    {tool.title}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/70">
                    {tool.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-white/50 group-hover:text-[#f2ca50] group-hover:translate-x-1 transition-all">
                  <span>Open tool</span>
                  <ArrowRight size={13} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout, onRestartOnboarding }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeNav = searchParams.get("tab") || "overview";
  const role = ROLE_DATA[user?.role] || ROLE_DATA.founder;
  const RoleIcon = role.icon;
  const firstName =
    user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
      {/* Top Header Bar */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <RoleIcon size={14} className="text-[#f2ca50]" /> {role.label}
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {role.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white">
            Good to see you, {firstName}. {role.subtitle}
          </p>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeNav === "overview" && (
        user?.role === "founder" ? (
          <FounderWorkspaceOverview />
        ) : (
          <EmptyState
            icon={role.icon}
            title="Open your workspace"
            copy="This account's live metrics and activity are shown in its dedicated workspace. No sample figures are presented here."
          />
        )
      )}

      {/* TASKS TAB */}
      {activeNav === "tasks" && (
        <EmptyState
          icon={CheckCircle2}
          title="Your task list is ready to build"
          copy="Tasks will appear here once they are created from your venture plan. No sample tasks are shown as real work."
        />
      )}

      {/* CAPITAL READINESS TAB */}
      {activeNav === "capital" && (
        <div className="max-w-3xl space-y-4">
          <EmptyState
            icon={Target}
            title="Capital readiness"
            copy="Almeriq does not calculate a verified capital-readiness score yet. Review your saved venture analysis and validation evidence before preparing a fundraising pitch."
          />
          <div className="flex flex-wrap gap-3">
            <Link to="/founder/analysis" className="alq-submit px-5 py-2.5 text-xs">Review AI strategy</Link>
            <Link to="/founder/validation" className="rounded-xl border border-white/20 px-5 py-2.5 text-xs font-semibold text-white">Review validation</Link>
          </div>
        </div>
      )}

      {/* TEAM TAB */}
      {activeNav === "team" && (
        <EmptyState
          icon={UserRound}
          title="Team & Operating Capacity"
          copy="Connect co-founders, advisors, and technical talent directly to your venture."
        />
      )}

      {/* PROFILE TAB */}
      {activeNav === "profile" && (
        <ProfileSummary
          user={user}
          role={role}
          onEdit={onRestartOnboarding}
        />
      )}

      {/* DISCOVER TAB */}
      {activeNav === "discover" && (
        <EmptyState
          icon={Search}
          title={`Discover for ${role.label.toLowerCase()}`}
          copy="Your personalized recommendations will appear here as the platform connects you with the right opportunities."
        />
      )}

      {/* ACTIVITY TAB */}
      {activeNav === "activity" && (
        <EmptyState
          icon={Clock3}
          title="Recent activity"
          copy="Updates, messages, and important next steps will collect here."
        />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, copy }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/2 px-6 text-center">
      <Icon size={26} className="text-[#f2ca50]" />
      <h2 className="mt-4 font-display text-xl font-semibold text-white">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white">
        {copy}
      </p>
    </div>
  );
}

function ProfileSummary({ user, role, onEdit }) {
  return (
    <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#12121a] p-5 sm:p-7">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f2ca50]/15 text-[#f2ca50]">
          <UserRound size={24} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">
            {user?.full_name || "Your profile"}
          </h2>
          <p className="text-sm text-white/50">{role.label}</p>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Info label="Email" value={user?.email} />
        <Info
          label="Nationality"
          value={user?.nationality || "Not specified"}
        />
        <Info
          label="Role"
          value={role.label}
        />
        <Info label="Status" value="Account active" />
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="mt-7 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/8"
      >
        Edit onboarding details
      </button>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-white">{value}</p>
    </div>
  );
}

export default Dashboard;
