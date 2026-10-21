import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lightbulb,
  CheckCircle2,
  Cpu,
  Boxes,
  Scale,
  Send,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { listVenturesApi, getValidationApi, listLegalFilingsApi } from "../lib/api";

export default function FounderHubPage() {
  const navigate = useNavigate();
  const [validationScore, setValidationScore] = useState(0);
  const [venturesCount, setVenturesCount] = useState(0);
  const [filingsCount, setFilingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [val, ventures, filings] = await Promise.allSettled([
          getValidationApi(),
          listVenturesApi(),
          listLegalFilingsApi(),
        ]);
        if (val.status === "fulfilled" && val.value) {
          setValidationScore(val.value.score || 0);
        }
        if (ventures.status === "fulfilled" && Array.isArray(ventures.value)) {
          setVenturesCount(ventures.value.length);
        }
        if (filings.status === "fulfilled" && Array.isArray(filings.value)) {
          setFilingsCount(filings.value.length);
        }
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const TOOLS = [
    {
      title: "Startup Idea & Feedback",
      desc: "Answer 5 quick questions about your idea to get instant analysis and advice.",
      link: "/founder/intake",
      badge: venturesCount > 0 ? `${venturesCount} saved` : "Ready",
      badgeColor: "text-[#C9A15A] bg-[#C9A15A]/10 border-[#C9A15A]/20",
      icon: Lightbulb,
    },
    {
      title: "Idea Checklist",
      desc: "Check 9 key things: do people actually want this, will they pay, and can you build it?",
      link: "/founder/validation",
      badge: `${validationScore}/9 points`,
      badgeColor: validationScore >= 6 ? "text-[#C9A15A] bg-[#C9A15A]/15 border-[#C9A15A]/30" : "text-white/60 bg-white/5 border-white/10",
      icon: CheckCircle2,
    },
    {
      title: "Startup Workspace Tools",
      desc: "Create simple 1-page plans, pitch slide notes, money estimates, and pros & cons.",
      link: "/founder/ai-tools",
      badge: "5 Document Tools",
      badgeColor: "text-[#C9A15A] bg-[#C9A15A]/10 border-[#C9A15A]/20",
      icon: Cpu,
    },
    {
      title: "Product & Tech Plan",
      desc: "Figure out who your users are, what tech to use, and what features to build first.",
      link: "/founder/product",
      badge: "4 Spec Tools",
      badgeColor: "text-[#C9A15A] bg-[#C9A15A]/10 border-[#C9A15A]/20",
      icon: Boxes,
    },
    {
      title: "Legal & Setup",
      desc: "Learn how to register your company name, protect your idea, and get starter contracts.",
      link: "/founder/legal",
      badge: filingsCount > 0 ? `${filingsCount} filed` : "Templates ready",
      badgeColor: filingsCount > 0 ? "text-[#C9A15A] bg-[#C9A15A]/15 border-[#C9A15A]/30" : "text-white/40 bg-white/5 border-white/10",
      icon: Scale,
    },
    {
      title: "Updates & Team",
      desc: "Write quick monthly progress updates and help-wanted posts to find teammates.",
      link: "/founder/outreach",
      badge: "Ready",
      badgeColor: "text-[#C9A15A] bg-[#C9A15A]/10 border-[#C9A15A]/20",
      icon: Send,
    },
  ];

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Founder Studio"
          subtitle="Everything you need to plan, test, and build your startup idea."
        />

        {/* Tools Grid */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[#F3F1EC]">
              Startup Tools
            </h3>
            <span className="text-xs text-[#9B9A94]">
              {TOOLS.length} tools available
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01] divide-y divide-white/5">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.title}
                  to={tool.link}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#f2ca50] group-hover:border-[#f2ca50]/40 transition-colors">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-display text-base font-semibold text-white group-hover:text-[#f2ca50] transition-colors">
                        {tool.title}
                      </h4>
                      <p className="mt-1 text-xs text-white/55 leading-relaxed max-w-2xl">
                        {tool.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-15 sm:pl-0">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </FounderFlowGuard>
  );
}
