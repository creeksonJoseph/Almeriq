import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Cpu,
  Boxes,
  Home,
  Lightbulb,
  Scale,
  Search,
  Send,
  Settings,
  Target,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { listVenturesApi } from "../lib/api";
import { StatStrip } from "./ui/BorderlessPrimitives";

const ROLE_DATA = {
  founder: {
    label: "Founder workspace",
    title: "Build with momentum.",
    subtitle: "Turn your next idea into a company people can believe in.",
    icon: Building2,
    stats: [
      ["Idea validation", "68%", "Strong early signal", "gold"],
      ["Active tasks", "08", "3 due this week", "white"],
      ["Capital target", "$250k", "Seed round", "gold"],
      ["Team members", "04", "2 roles open", "white"],
    ],
    primaryTitle: "Your build plan",
    primaryCopy:
      "Keep the next important moves visible and turn progress into proof.",
    rows: [
      ["Validate customer problem", "In progress", "Today"],
      ["Prepare investor one-pager", "Ready", "Tomorrow"],
      ["Find a product designer", "Open role", "This week"],
    ],
    secondaryTitle: "Capital readiness",
    secondaryCopy: "Your company profile is 72% ready for investor matching.",
    secondaryAction: "Complete company profile",
  },
  investor: {
    label: "Investor workspace",
    title: "Find what is worth backing.",
    subtitle:
      "A focused view of promising companies, active conversations, and your portfolio.",
    icon: TrendingUp,
    stats: [
      ["New deal flow", "24", "+6 this week", "gold"],
      ["Deployed capital", "$1.2m", "Across 8 companies", "white"],
      ["Avg. response", "2d", "Down from 4d", "gold"],
      ["Saved companies", "12", "4 new updates", "white"],
    ],
    primaryTitle: "Deal flow",
    primaryCopy: "Companies aligned with your sectors and stage preferences.",
    rows: [
      ["Neonix · Health tech", "Series A", "$2.4m ask"],
      ["Harvestly · Agriculture", "Seed", "$800k ask"],
      ["Ledgerly · Fintech", "Series A", "$3.1m ask"],
    ],
    secondaryTitle: "Portfolio pulse",
    secondaryCopy: "3 portfolio companies shared updates this week.",
    secondaryAction: "Review updates",
  },
  infrastructure: {
    label: "Infrastructure workspace",
    title: "Put your assets to work.",
    subtitle:
      "Manage listings, requests, and the companies looking for what you provide.",
    icon: Building2,
    stats: [
      ["Active listings", "18", "All systems live", "gold"],
      ["Utilization", "74%", "+12% this month", "white"],
      ["Monthly revenue", "$84k", "Across 11 orders", "gold"],
      ["Open requests", "07", "2 need response", "white"],
    ],
    primaryTitle: "Open requests",
    primaryCopy:
      "Companies looking for equipment, connectivity, and operating capacity.",
    rows: [
      ["Terraforge · Excavators", "Needs quote", "Nairobi"],
      ["OrbitLink · Satellite", "New request", "Lagos"],
      ["Voltway · Solar arrays", "In review", "Accra"],
    ],
    secondaryTitle: "Listing health",
    secondaryCopy:
      "Your listings are performing above the marketplace average.",
    secondaryAction: "Manage listings",
  },
  job_seeker: {
    label: "Talent workspace",
    title: "Make your next move count.",
    subtitle:
      "Stay close to roles and teams that match the work you want to do.",
    icon: BriefcaseBusiness,
    stats: [
      ["Profile strength", "82%", "Add 2 more skills", "gold"],
      ["New matches", "14", "+5 this week", "white"],
      ["Applications", "06", "2 awaiting reply", "gold"],
      ["Interviews", "02", "Next one Friday", "white"],
    ],
    primaryTitle: "Recommended for you",
    primaryCopy:
      "Roles and teams selected from your skills, location, and interests.",
    rows: [
      ["Product Designer · Neonix", "Matched 94%", "Remote"],
      ["UX Engineer · Terraforge", "Matched 88%", "Nairobi"],
      ["Design Lead · Harvestly", "Matched 81%", "Hybrid"],
    ],
    secondaryTitle: "Profile momentum",
    secondaryCopy:
      "Adding a portfolio link could increase your match rate by 18%.",
    secondaryAction: "Improve profile",
  },
};

const NAV_ITEMS = [
  ["overview", "Overview", Home],
  ["discover", "Discover", Search],
  ["activity", "Activity", Bell],
  ["profile", "Profile", UserRound],
];

function StatCard({ stat }) {
  const [label, value, note, tone] = stat;
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-[#141417] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
          {label}
        </span>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${tone === "gold" ? "bg-[#f2ca50]" : "bg-white/40"}`}
        />
      </div>
      <p className="font-display text-2xl font-semibold text-white sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-white/50">{note}</p>
    </div>
  );
}

function WorkspacePanel({ data }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12121a] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">
            Workspace signal
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-white">
            {data.primaryTitle}
          </h2>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-white/50 sm:text-right">
          {data.primaryCopy}
        </p>
      </div>
      <div className="divide-y divide-white/10">
        {data.rows.map(([title, status, meta]) => (
          <button
            key={title}
            type="button"
            className="flex w-full items-center gap-3 py-4 text-left transition-colors hover:bg-white/3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/6 text-[#f2ca50]">
              <CheckCircle2 size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">
                {title}
              </span>
              <span className="mt-1 block text-xs text-white/45">{meta}</span>
            </span>
            <span className="hidden rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-semibold text-white/60 sm:block">
              {status}
            </span>
            <ChevronRight size={16} className="shrink-0 text-white/35" />
          </button>
        ))}
      </div>
    </div>
  );
}

import { useActiveIdea } from "../context/IdeaContext";

function FounderWorkspaceOverview() {
  const { ventures, activeVenture, setActiveVentureId } = useActiveIdea();

  const target = activeVenture || (ventures && ventures.length > 0 ? ventures[0] : null);
  const ventureName = target?.name || target?.idea || null;
  const ventureWhatBuilding = target?.name ? target.idea : "";
  const ventureProblem = target?.problem || "";

  return (
    <div className="space-y-6">
      {/* 1. ACTIVE STARTUP IDEA */}
      {ventureName ? (
        <div className="rounded-2xl  bg-[#141417] p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2ca50]">
                Active Startup Idea
              </span>
              <h2 className="mt-1.5 font-display text-2xl font-semibold text-white tracking-tight sm:text-3xl">
                {ventureName}
              </h2>
              {ventureWhatBuilding && (
                <p className="mt-2 text-sm font-medium leading-relaxed text-white">
                  {ventureWhatBuilding}
                </p>
              )}
              {ventureProblem && (
                <p className="mt-1.5 text-xs leading-relaxed text-white/80">
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
                className="rounded-xl border border-white/20 px-3.5 py-2 text-xs font-semibold text-white hover:text-[#f2ca50] hover:border-white/40 transition-colors"
              >
                Edit idea
              </Link>
              <Link
                to="/founder/intake?mode=new"
                className="rounded-xl border border-dashed border-white/20 px-3.5 py-2 text-xs font-semibold text-white hover:text-[#f2ca50] hover:border-white/40 transition-colors"
              >
                + New idea
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <h2 className="font-display text-xl font-semibold text-white">No startup idea yet</h2>
          <p className="mt-2 text-sm text-white max-w-md mx-auto">
            Add your startup idea to get AI analysis, market validation, and a build roadmap.
          </p>
          <div className="mt-5 flex justify-center">
            <Link to="/founder/intake?mode=new" className="alq-submit text-xs py-2 px-5">
              + Add your startup idea <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* 2. TOOLS */}
      <div>
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">
            Tools
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#141417] p-5 hover:border-[#f2ca50]/40 transition-all shadow-sm"
              >
                <div>
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2ca50]/10 text-[#f2ca50]">
                    <Icon size={18} />
                  </div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-[#f2ca50] transition-colors">
                    {tool.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-white">
                    {tool.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#f2ca50] group-hover:translate-x-1 transition-transform">
                  <span>Open tool</span>
                  <ArrowRight size={13} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. RECENT VENTURES QUICK-SWITCHER */}
      {ventures && ventures.length > 1 && (
        <div className="rounded-2xl border border-white/10 bg-[#141417] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-white">Your Saved Ideas</h3>
              <p className="text-xs text-white mt-0.5">Switch active context</p>
            </div>
            <Link
              to="/founder/ventures"
              className="text-xs font-semibold text-[#f2ca50] hover:underline"
            >
              View all ({ventures.length}) →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {ventures.slice(0, 3).map((v) => {
              const isSelected = activeVenture && String(activeVenture.id) === String(v.id);
              return (
                <div
                  key={v.id}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${isSelected
                      ? "border-[#f2ca50]/40 bg-[#f2ca50]/5 text-white"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white"
                    }`}
                >
                  <div className="min-w-0 mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="truncate text-xs font-semibold text-white">
                        {v.name || v.idea}
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-[#f2ca50]/20 px-2 py-0.5 text-[9px] font-bold text-[#f2ca50]">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white line-clamp-2">
                      {v.name ? v.idea : (v.problem || v.solution || "No description provided.")}
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-white/5">
                    <Link
                      to={`/founder/ventures/${v.id}`}
                      className="text-[11px] font-semibold text-[#f2ca50] hover:underline"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
        <button
          type="button"
          className="relative mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-white/60 hover:text-white sm:flex"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f2ca50]" />
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeNav === "overview" && (
        user?.role === "founder" ? (
          <FounderWorkspaceOverview />
        ) : (
          <>
            <StatStrip
              items={role.stats.map(([label, value, note, tone]) => ({
                label,
                value,
                subtext: note,
                valueColor: tone === "gold" ? "text-[#f2ca50]" : "text-white/80",
              }))}
              className="mb-6"
            />
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
              <WorkspacePanel data={role} />
              <div className="rounded-2xl border border-[#f2ca50]/30 bg-[#f2ca50]/6 p-5 sm:p-6">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2ca50]/15 text-[#f2ca50]">
                  <Target size={19} />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">
                  Next best action
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">
                  {role.secondaryTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white">
                  {role.secondaryCopy}
                </p>
                <button
                  type="button"
                  className="mt-6 text-xs font-semibold text-[#f2ca50] hover:text-white"
                >
                  {role.secondaryAction}
                </button>
              </div>
            </div>
          </>
        )
      )}

      {/* TASKS TAB */}
      {activeNav === "tasks" && (
        <div className="grid grid-cols-1 gap-5">
          <WorkspacePanel data={role} />
        </div>
      )}

      {/* CAPITAL READINESS TAB */}
      {activeNav === "capital" && (
        <div className="max-w-3xl rounded-2xl border border-[#f2ca50]/30 bg-[#f2ca50]/6 p-6 sm:p-8">
          <Target size={26} className="text-[#f2ca50]" />
          <h2 className="mt-3 font-display text-2xl font-semibold text-white">
            {role.secondaryTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white">
            {role.secondaryCopy}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/founder/analysis"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B]"
            >
              Generate AI Strategy & Plan
            </Link>
            <Link
              to="/founder/validation"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              Check Validation Score
            </Link>
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
        <Info label="Status" value="Verified account" />
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
