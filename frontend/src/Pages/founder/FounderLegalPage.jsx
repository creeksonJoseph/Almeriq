import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
  Building2,
  FileText,
  Printer,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import FounderStudioNav from "../../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../../components/founder/FounderFlowLayout";
import { useFounderLegalWorkspace } from "../../hooks/useFounderLegalWorkspace";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { COUNTRIES } from "../../lib/countries";
import { Skeleton, SkeletonText } from "../../components/ui";

// ── Plain English Starter Legal Templates ─────────────────────────────────────
const LEGAL_TEMPLATES = [
  {
    id: "nda",
    title: "Mutual Non-Disclosure Agreement (NDA)",
    tag: "Keep Secrets Safe",
    desc: "A two-way agreement so both sides can share ideas safely without worrying that the other person will copy or share them.",
    content: `MUTUAL NON-DISCLOSURE AGREEMENT

1. WHY WE ARE SHARING INFORMATION:
We are sharing ideas, plans, and details to see if we should work together on a startup project.

2. WHAT IS PRIVATE:
Everything we share about the product, code, business plans, and finances is private unless we both agree in writing that it is public.

3. PROMISE TO KEEP SECRETS:
Both parties promise not to share this private information with anyone else, and to use it only to evaluate this project.

4. HOW LONG THIS LASTS:
This agreement protects secrets for [insert an agreed duration] from the date information is shared.

5. GOVERNING LAW:
This agreement follows the standard business laws of the place where the company is registered.`,
  },
  {
    id: "ip_assignment",
    title: "Inventions and Intellectual Property Agreement (PIIA)",
    tag: "Company Owns Code",
    desc: "Makes sure all software code, designs, and ideas created for the startup belong to the company, not to any individual person.",
    content: `INVENTIONS AND INTELLECTUAL PROPERTY AGREEMENT

1. COMPANY OWNS ALL WORK:
Work ownership depends on local law and a valid written assignment. Identify the work covered, the people assigning it, and any agreed exceptions.

2. NO OUTSIDE CLAIMS:
You confirm that the work you do here does not belong to any former school, employer, or past project.

3. HELPING WITH PAPERWORK:
If the company ever needs to file a trademark or patent, you agree to help sign the needed documents.`,
  },
  {
    id: "safe",
    title: "Simple Agreement for Future Equity (SAFE)",
    tag: "Simple Investment Deal",
    desc: "A standard contract to take investment money today and give the investor company shares in the future.",
    content: `SIMPLE AGREEMENT FOR FUTURE EQUITY (SAFE)

1. INVESTMENT AMOUNT:
The investor gives the startup money today in exchange for shares when the company does its next funding round.

2. VALUATION CAP:
Sets the maximum price the investor pays when their investment turns into shares.

3. DISCOUNT RATE:
Insert the discount, if any, that both sides negotiate and approve in the final agreement.

4. WHAT HAPPENS IN A SALE:
If the company is sold, the investor gets their money back or gets shares in the sale.`,
  },
  {
    id: "founder_accord",
    title: "Founders' Agreement (MOU)",
    tag: "Co-Founder Rules",
    desc: "Agrees on who owns what percentage of the company, how shares vest over 4 years, and how major decisions are made.",
    content: `FOUNDERS' AGREEMENT (MOU)

1. OWNERSHIP SPLIT:
The founders agree on what percentage of the company each person owns.

2. VESTING (4 YEARS WITH 1-YEAR CLIFF):
Use a vesting schedule that all founders agree to. A four-year schedule with a one-year cliff is one common example, not a legal requirement.

3. ALL IDEAS BELONG TO THE COMPANY:
All code, domain names, and prototypes created before today belong to the company.

4. MAKING BIG DECISIONS:
Major decisions like selling the company or taking large loans require all founders to agree.`,
  },
  {
    id: "data_protection",
    title: "Data Protection Policy Starter",
    tag: "Handle Customer Data",
    desc: "A starting point for documenting what personal data your business collects and how it is protected.",
    content: `DATA PROTECTION POLICY STARTER

1. PURPOSE:
Explain why your business collects personal information and which services need it.

2. DATA COLLECTED:
List each type of personal information collected, where it comes from, and whether it is required.

3. HOW DATA IS USED:
Describe the exact business purposes for using each type of information. Do not use data for unrelated purposes without a valid basis.

4. ACCESS AND SECURITY:
Limit access to people who need it for their work. Use suitable security controls, backups, and access reviews.

5. RETENTION AND DELETION:
Set a retention period for each data type. Explain how people can request access, correction, or deletion where the law gives them that right.

6. THIRD PARTIES:
List processors and service providers that receive personal data, and document the safeguards and agreements that apply.

7. CONTACT:
Provide a real privacy contact and a process for handling privacy requests or incidents.

Complete this with the rules that apply in your country before using it with customers.`,
  },
  {
    id: "industry_license",
    title: "Industry Licensing Checklist",
    tag: "Check Sector Rules",
    desc: "A checklist for identifying permits and approvals your business may need before operating.",
    content: `INDUSTRY LICENSING CHECKLIST

1. DESCRIBE THE ACTIVITY:
Write down exactly what your company will sell, provide, store, transport, or process.

2. CHECK THE REGULATOR:
Identify the government office that regulates this activity in every country or region where you will operate.

3. LIST REQUIRED APPROVALS:
Record each licence, permit, registration, professional approval, or inspection that may apply.

4. CHECK THE CONDITIONS:
For every approval, note who can apply, required documents, fees, renewal dates, and operating limits.

5. CONFIRM BEFORE LAUNCH:
Contact the regulator or a qualified local adviser to confirm the current rules. Do not treat this checklist as proof that you are licensed.

6. KEEP RECORDS:
Store applications, approval letters, renewal dates, and inspection records in one secure place.`,
  },
];

// ── Plain English Why-Register Pillars (Strict White, Gold & Dark) ───────────
const THESIS_PILLARS = [
  {
    index: "01",
    title: "Keep Your Personal Money Safe",
    category: "Personal Protection",
    desc: "A limited liability company can separate many business debts from personal assets. Personal guarantees, misconduct, director duties, and local law can create exceptions.",
  },
  {
    index: "02",
    title: "Take Money From Investors",
    category: "Ready for Funding",
    desc: "Investors often expect clear company ownership records and written investment terms. The right structure depends on the deal and local law.",
  },
  {
    index: "03",
    title: "Open Business Bank Accounts and Stripe",
    category: "Payments and Banking",
    desc: "Banks and payment providers may ask for company documents, tax details, or other checks. Requirements vary by provider and country.",
  },
  {
    index: "04",
    title: "Sign Deals With Other Companies",
    category: "Customer Trust",
    desc: "Businesses and enterprise clients only sign vendor agreements and pay invoices to registered companies, not individuals.",
  },
  {
    index: "05",
    title: "Protect Your Code and Brand",
    category: "Company Ownership",
    desc: "Registering ensures your software code, logo, and ideas belong to the business. This stops a co-founder from leaving and taking your product with them.",
  },
];

// ── Normalization Helpers for Any Country's AI Output ─────────────────────────
function normalizePrerequisite(item) {
  if (typeof item === "string") {
    const colonIdx = item.indexOf(":");
    if (colonIdx > 0 && colonIdx < 50) {
      return {
        title: item.slice(0, colonIdx).trim(),
        desc: item.slice(colonIdx + 1).trim(),
      };
    }
    return { title: item, desc: "" };
  }
  return {
    title: item?.title || item?.name || "Document Required",
    desc: item?.desc || item?.description || "",
  };
}

function normalizePitfall(item) {
  if (typeof item === "string") {
    const colonIdx = item.indexOf(":");
    if (colonIdx > 0 && colonIdx < 50) {
      return {
        label: item.slice(0, colonIdx).trim(),
        text: item.slice(colonIdx + 1).trim(),
      };
    }
    return { label: "", text: item };
  }
  return {
    label: item?.label || item?.title || "",
    text: item?.text || item?.desc || item?.description || "",
  };
}

function normalizePostRegistration(item, idx) {
  const defaultAgencies = [
    "Tax and Revenue Authority",
    "Commercial Bank or Fintech",
    "City or County Council",
    "Social Security and Labor Office",
  ];
  const defaultWindows = [
    "Within 10 Days",
    "Within 14 Days",
    "Within 21 Days",
    "Within 30 Days",
  ];

  if (typeof item === "string") {
    const colonIdx = item.indexOf(":");
    if (colonIdx > 0 && colonIdx < 50) {
      return {
        milestone: item.slice(0, colonIdx).trim(),
        agency: defaultAgencies[idx % defaultAgencies.length],
        action: item.slice(colonIdx + 1).trim(),
        window: defaultWindows[idx % defaultWindows.length],
      };
    }
    return {
      milestone: item.length > 45 ? `${item.slice(0, 42)}...` : item,
      agency: defaultAgencies[idx % defaultAgencies.length],
      action: item,
      window: defaultWindows[idx % defaultWindows.length],
    };
  }
  return {
    milestone: item?.milestone || item?.title || "Next Step",
    agency: item?.agency || defaultAgencies[idx % defaultAgencies.length],
    action: item?.action || item?.description || item?.desc || "",
    window: item?.window || defaultWindows[idx % defaultWindows.length],
  };
}

export default function FounderLegalPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const activeMode = location.pathname.endsWith("/templates") ? "templates" : location.pathname.endsWith("/filings") ? "filings" : "dossier";
  const setActiveMode = (mode) => navigate(mode === "templates" ? "/founder/legal/templates" : mode === "filings" ? "/founder/legal/filings" : "/founder/legal/guide");
  const [filingForm, setFilingForm] = useState({ filing_type: "company", company_name: "", entity_type: "Ltd", jurisdiction: "", ip_title: "", ip_type: "Source Code", ip_description: "" });

  // Company registration guide stepper: 1 = Why & Steps, 2 = Documents & Next Steps
  const [guideStep, setGuideStep] = useState(1);

  // Detect user's initial country from profile (nationality) or default to Kenya
  const initialCountry = useMemo(() => {
    const rawNationality = (user?.nationality || "").trim();
    if (!rawNationality) return "Kenya";
    const matched = COUNTRIES.find(
      (c) =>
        c.code.toLowerCase() === rawNationality.toLowerCase() ||
        c.name.toLowerCase() === rawNationality.toLowerCase()
    );
    return matched ? matched.name : rawNationality;
  }, [user?.nationality]);

  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  // Starter contracts state
  const [selectedTemplate, setSelectedTemplate] = useState(LEGAL_TEMPLATES[0]);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const handleCountryChange = (event) => setSelectedCountry(event.target.value);

  const copyTemplateContent = () => {
    if (!selectedTemplate) return;
    navigator.clipboard.writeText(selectedTemplate.content);
    setCopiedTemplate(true);
    showToast("Template copied to clipboard", "success");
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const legalWorkspace = useFounderLegalWorkspace({ selectedCountry, filingForm, setFilingForm, showToast });
  const { filings, filingLoading, filingSaving, filingError, submitFiling, guide, guideLoading, guideError, refreshGuide } = legalWorkspace;

  // Safe normalized collections
  const prerequisitesList = useMemo(() => {
    if (!guide?.prerequisites || !Array.isArray(guide.prerequisites)) return [];
    return guide.prerequisites.map(normalizePrerequisite);
  }, [guide?.prerequisites]);

  const pitfallsList = useMemo(() => {
    if (!guide?.common_pitfalls || !Array.isArray(guide.common_pitfalls)) return [];
    return guide.common_pitfalls.map(normalizePitfall);
  }, [guide?.common_pitfalls]);

  const postRegList = useMemo(() => {
    if (!guide?.post_registration || !Array.isArray(guide.post_registration)) return [];
    return guide.post_registration.map(normalizePostRegistration);
  }, [guide?.post_registration]);

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-10">
        {/* Top Navigation Bar with Back Button & Page Title */}
        <FounderStudioNav
          title="Legal and Company Registration"
          subtitle="How to register your company step by step, protect your personal money, and access basic legal templates."
        />

        {/* ── Clean Mode Tabs (Hidden in Print) ── */}
        <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-5 no-print">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-md bg-white/[0.04] p-0.5 border border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveMode("dossier")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
                activeMode === "dossier"
                  ? "bg-[#f2ca50] text-black font-semibold shadow-sm"
                  : "text-white hover:text-[#f2ca50]"
              }`}
            >
              <Building2 size={13} className={activeMode === "dossier" ? "text-black" : "text-[#f2ca50]"} />
              <span>Company Registration Guide</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("templates")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
                activeMode === "templates"
                  ? "bg-[#f2ca50] text-black font-semibold shadow-sm"
                  : "text-white hover:text-[#f2ca50]"
              }`}
            >
              <FileText size={13} className={activeMode === "templates" ? "text-black" : "text-[#f2ca50]"} />
              <span>Starter Legal Templates</span>
            </button>
            <button type="button" onClick={() => setActiveMode("filings")} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-all cursor-pointer ${activeMode === "filings" ? "bg-[#f2ca50] text-black font-semibold shadow-sm" : "text-white hover:text-[#f2ca50]"}`}>
              <FileText size={13} className={activeMode === "filings" ? "text-black" : "text-[#f2ca50]"} />
              <span>My Registration Requests</span>
            </button>
          </div>
        </div>

        {/* ── MODE 1: COMPANY REGISTRATION GUIDE ── */}
        {activeMode === "dossier" && (
          <div className="space-y-12">
            {/* Stepper Navigation */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div className="flex items-center gap-4 text-xs font-mono">
                {[
                  { step: 1, label: "Why & Steps" },
                  { step: 2, label: "Documents & Next Steps" },
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setGuideStep(s.step)}
                    className={`flex items-center gap-2 transition-colors ${
                      guideStep === s.step
                        ? "text-[#f2ca50] font-semibold"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors ${
                      guideStep === s.step
                        ? "bg-[#f2ca50] text-black border-transparent"
                        : "border-white/20 text-white"
                    }`}>
                      {s.step}
                    </span>
                    <span>{s.label}</span>
                  </button>
                ))}
                {guideStep === 2 && (
                  <span className="text-[10px] text-white/40">· Page 2 of 2</span>
                )}
              </div>
              {guideStep === 1 && (
                <button
                  type="button"
                  onClick={() => setGuideStep(2)}
                  className="inline-flex items-center gap-2 rounded bg-[#f2ca50] px-4 py-2 text-xs font-semibold text-black hover:bg-[#e2ba40] transition-colors cursor-pointer shadow-sm"
                >
                  Next: Documents & Next Steps <ArrowRight size={12} />
                </button>
              )}
              {guideStep === 2 && (
                <button
                  type="button"
                  onClick={() => setGuideStep(1)}
                  className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={12} /> Back: Why & Steps
                </button>
              )}
            </div>
              {guideStep === 1 && (
                <section className="border-b border-white/10 pb-12">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <div className="lg:col-span-4 space-y-4">
                  <div className="inline-flex items-center gap-2 text-[11px] font-mono text-[#f2ca50] uppercase tracking-wider">
                    <span>01 / Start Here</span>
                  </div>
                  <h2 className="font-serif text-2xl font-medium text-white tracking-tight sm:text-3xl">
                    Why You Should Register Your Company Early
                  </h2>
                  <p className="text-sm font-normal text-white leading-relaxed">
                    If you run a business without registering it, you are personally responsible for everything that goes wrong. If the business gets sued or owes money, you could lose your personal savings. Registering your company separates the business from you as a person, making it safe to grow, take investments, and hire people.
                  </p>
                  <div className="rounded border border-white/10 bg-white/[0.02] p-4 text-xs text-white space-y-2">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#f2ca50]">
                      Simple Legal Rule
                    </div>
                    <p className="italic text-white font-normal">
                      "Your company is its own legal person. Any debts or legal problems belong to the company, not to you or your family."
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  {/* Structured Line-item List of Foundation Pillars */}
                  <div className="divide-y divide-white/5 border-t border-b border-white/10">
                    {THESIS_PILLARS.map((pillar) => (
                      <div
                        key={pillar.index}
                        className="group flex items-start gap-5 py-4 px-2 transition-colors hover:bg-white/[0.015]"
                      >
                        <span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-[#f2ca50]">
                          {pillar.index}
                        </span>
                        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3 md:gap-6">
                          <div className="md:col-span-1">
                            <h3 className="text-sm font-semibold text-white transition-colors group-hover:text-[#f2ca50]">
                              {pillar.title}
                            </h3>
                            <span className="text-[11px] font-mono text-white/70">
                              {pillar.category}
                            </span>
                          </div>
                          <div className="text-xs font-normal text-white leading-relaxed md:col-span-2">
                            {pillar.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
                )}
            {/* ── PART 2: THE GUIDANCE (Official Registration in {selectedCountry}) ── */}
            {guideStep === 2 && (
              <section className="space-y-8">
              {/* Guidance Header with Full Width Title and Dedicated Toolbar Below */}
              <div className="border-b border-white/10 pb-6 space-y-5">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#f2ca50] uppercase">
                    <span className="h-0.5 w-2 bg-[#f2ca50]"></span> 02 / Official Registration Guidance
                  </div>
                  <h1 className="font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                    Company Registration <span className="italic text-[#f2ca50] font-normal">&amp;</span> Legal Standing in{" "}
                    <span className="text-[#f2ca50]">{guide?.country_name || selectedCountry}</span>
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm font-normal text-white leading-relaxed">
                    Select your country to view official registration procedures, regulatory fees, timelines, and required documents.
                  </p>
                </div>

                {/* Dedicated Action & Country Selection Toolbar Below the Title */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 no-print">
                  {/* Country Jurisdiction Selector */}
                  <div className="relative flex items-center">
                    <label className="sr-only" htmlFor="guidance-jurisdiction-select">
                      Select Country
                    </label>
                    <div className="flex items-center gap-2.5 rounded-md bg-[#13141b] border border-white/10 px-3.5 py-2 text-xs transition-colors hover:border-[#f2ca50]/50 shadow-sm">
                      <span className="text-[11px] font-mono text-[#f2ca50] uppercase tracking-wider">Country:</span>
                      <select
                        id="guidance-jurisdiction-select"
                        value={selectedCountry}
                        onChange={handleCountryChange}
                        className="bg-transparent font-medium text-white focus:outline-none cursor-pointer pr-1"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.name} className="bg-[#13141b] text-white">
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions on the right */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={refreshGuide}
                      disabled={guideLoading}
                      className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCcw
                        size={13}
                        className={guideLoading ? "animate-spin text-[#f2ca50]" : "text-[#f2ca50]"}
                      />
                      <span>{guideLoading ? "Checking..." : "Refresh"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      disabled={guideLoading || !guide}
                      className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
                      title="Print or Save as PDF"
                    >
                      <Printer size={13} className="text-[#f2ca50]" />
                      <span>Save as PDF / Print</span>
                    </button>

                    {!guideLoading && guide?.portal_url && (
                      <a
                        href={
                          guide.portal_url.startsWith("http")
                            ? guide.portal_url
                            : `https://${guide.portal_url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded bg-[#f2ca50] px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#e2ba40] shadow-sm cursor-pointer"
                      >
                        <span>Suggested Registry Portal</span>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Loading State when country is selected or refreshing */}
              {guideLoading && (
                <div className="space-y-5 rounded-xl bg-surface p-6" aria-label="Loading registration guide" aria-busy="true">
                  <Skeleton className="h-7 w-2/3 max-w-md" />
                  <SkeletonText lines={3} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[0, 1, 2, 3].map((item) => <div key={item} className="space-y-3 rounded-lg bg-surface-2 p-4"><Skeleton className="h-4 w-1/2" /><SkeletonText lines={3} /></div>)}
                  </div>
                </div>
              )}

              {/* Error State with Retry Button */}
              {!guideLoading && guideError && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-4">
                  <AlertCircle size={36} className="mx-auto text-[#f2ca50]" />
                  <h3 className="font-serif text-lg font-medium text-white">
                    Could Not Load Registration Guide for {selectedCountry}
                  </h3>
                  <p className="mx-auto max-w-md text-xs font-normal text-white leading-relaxed">
                    {guideError}
                  </p>
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={refreshGuide}
                      className="inline-flex items-center gap-2 rounded bg-[#f2ca50] px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-[#e2ba40] cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Retry Request</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loaded Country Guidance Content */}
              {!guideLoading && !guideError && guide && (
                <div className="space-y-12">
                  {/* Metric Data Strip: Estimated Timeline, Fees, Registry for THIS country */}
                  <section className="rounded-2xl border border-[#f2ca50]/25 bg-[#f2ca50]/[0.04] p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">
                          At a glance
                        </p>
                        <p className="mt-1 text-xs text-white/70">
                          The key facts for registering in {guide.country_name || selectedCountry}.
                        </p>
                      </div>
                      <span className="hidden text-[10px] font-mono uppercase tracking-wider text-white/50 sm:block">
                        AI-generated guide
                      </span>
                    </div>
                    <p className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">AI-generated guidance, not live government data. Verify the registry, portal URL, fees, requirements and timelines directly with the relevant authority before acting.</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-[#090a0d]/45 p-4">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-white/60">
                        Official Registry
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-white truncate">
                        {guide.regulatory_body || "Government Company Registry"}
                      </span>
                      <span className="text-[11px] text-white/70 truncate block">
                        {guide.country_name || selectedCountry}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#090a0d]/45 p-4">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-white/60">
                        Expected Time
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-white">
                        {guide.estimated_timeline || "3 to 7 business days"}
                      </span>
                      <span className="text-[11px] font-mono text-[#f2ca50]">
                        Standard queue
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#090a0d]/45 p-4">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-white/60">
                        Estimated Fees · Confirm with Registry
                      </span>
                      <span className="mt-1 block font-mono text-sm font-semibold text-white">
                        {guide.estimated_cost || "Standard government fee"}
                      </span>
                      <span className="text-[11px] text-white/70">
                        Official registry fee
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#090a0d]/45 p-4">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-white/60">
                        Company Type
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-white">
                        Private Limited Company (Ltd)
                      </span>
                      <span className="text-[11px] font-mono text-[#f2ca50]">
                        {guide.source === "database" ? "Saved in Database" : "Freshly Generated"}
                      </span>
                      </div>
                    </div>
                  </section>

                {/* ── Section 02: Step-by-Step Procedure & Pre-filing Checklist ── */}
                <section className="grid grid-cols-1 gap-8 border-b border-[#1e2025] pb-12 lg:grid-cols-12 lg:gap-12">
                  {/* Left Column: Sequential Milestone Timeline */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold text-[#f2ca50] uppercase tracking-wider">
                        <span>Do this first</span>
                      </div>
                      <h2 className="mt-1 font-serif text-2xl font-medium text-white tracking-tight sm:text-3xl">
                        How to Register Your Company Step by Step
                      </h2>
                      <p className="mt-1 text-xs text-white/80">
                        Follow these simple steps through the official registry in{" "}
                        {guide.country_name || selectedCountry}.
                      </p>
                    </div>

                    {/* Chronological Step Timeline */}
                    {guide.steps && guide.steps.length > 0 && (
                      <div className="relative ml-2 mt-6 space-y-8 border-l border-[#282a2f] pl-6">
                        {guide.steps.map((step, idx) => (
                          <div key={idx} className="group relative">
                            {/* Timeline Node Indicator */}
                            <div className="absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#090a0d] border-2 border-[#f2ca50]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#f2ca50]"></span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-baseline justify-between">
                                <h3 className="text-sm font-semibold text-white transition-colors group-hover:text-[#f2ca50]">
                                  {step.step_number || idx + 1}. {step.title}
                                </h3>
                                <span className="text-[10px] font-mono text-[#f2ca50]">
                                  {step.online_process || "Online"}
                                </span>
                              </div>

                              <p className="text-xs font-normal text-white leading-relaxed">
                                {step.description}
                              </p>

                              {step.requirements && (
                                <div className="flex flex-wrap gap-2 pt-1.5 text-[11px] font-mono text-white">
                                  <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-white/80">
                                    What you need: {step.requirements}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pre-Filing Checklist & Common Pitfalls */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Documents You Need Before You Start */}
                    <div className="rounded-2xl bg-[#13141b] p-6">
                      <div className="flex items-center justify-between border-b border-[#282a2f] pb-3">
                        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                          Documents You Need Before You Start
                        </h3>
                        <span className="text-[10px] font-mono text-[#f2ca50]">
                          {prerequisitesList.length} Items
                        </span>
                      </div>

                      <ul className="mt-2 divide-y divide-white/5 text-xs">
                        {prerequisitesList.length > 0 ? (
                          prerequisitesList.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 py-2.5">
                              <span className="font-mono text-xs font-bold text-[#f2ca50]">✓</span>
                              <div>
                                <span className="block font-medium text-white">{item.title}</span>
                                {item.desc && (
                                  <span className="text-[11px] font-normal text-white/70">{item.desc}</span>
                                )}
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="py-3 text-white font-normal">
                            Copies of your national ID or passport, your registered address, and founder list.
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Common Mistakes to Avoid */}
                    <div className="rounded-2xl bg-[#13141b] p-6">
                      <div className="flex items-center justify-between border-b border-[#282a2f] pb-3">
                        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#f2ca50]">
                          Mistakes to Avoid
                        </h3>
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/70">
                          Important
                        </span>
                      </div>

                      <div className="mt-3 space-y-3 text-xs leading-relaxed">
                        {pitfallsList.length > 0 ? (
                          pitfallsList.map((pitfall, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                              <span className="font-mono text-xs text-[#f2ca50]">•</span>
                              <p className="text-white font-normal">
                                {pitfall.label ? (
                                  <strong className="font-medium text-white">{pitfall.label}: </strong>
                                ) : null}
                                {pitfall.text}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-white font-normal">
                            Make sure the company name is not already taken and that your name on your ID matches your tax registration details.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

            {/* ── Section 03: Immediate Next Steps ── */}
            <section className="space-y-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold text-[#f2ca50] uppercase tracking-wider">
                    <span>Do this next</span>
                  </div>
                  <h2 className="mt-1 font-serif text-2xl font-medium text-white tracking-tight sm:text-3xl">
                    Things to Do Right After Getting Your Certificate
                  </h2>
                </div>
                <p className="font-mono text-xs text-white/70">
                  Complete these within 30 days of receiving your certificate
                </p>
              </div>

              {/* Clean Tabular Next Steps Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#282a2f] bg-[#13141b]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#282a2f] bg-white/[0.03] text-[10px] font-mono uppercase text-white/70">
                      <th className="py-3 px-4 font-semibold">Next Step</th>
                      <th className="py-3 px-4 font-semibold">Where to Go</th>
                      <th className="py-3 px-4 font-semibold">What You Need to Do</th>
                      <th className="py-3 px-4 font-semibold text-right">Recommended Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white">
                    {postRegList.length > 0 ? (
                      postRegList.map((row, idx) => (
                        <tr key={idx} className="transition-colors hover:bg-white/[0.015]">
                          <td className="py-3 px-4 font-medium text-white">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#f2ca50]"></span>
                              {row.milestone}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-white/80">{row.agency}</td>
                          <td className="py-3 px-4 font-normal text-white">{row.action}</td>
                          <td className="py-3 px-4 text-right font-mono text-[#f2ca50]">
                            {row.window}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-white/[0.015]">
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f2ca50]"></span>
                          Get Company Tax Number
                        </td>
                        <td className="py-3 px-4 font-mono text-white/80">Revenue Authority</td>
                        <td className="py-3 px-4 font-normal text-white">
                          Register your company for a tax number so you can send legal invoices to customers.
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#f2ca50]">
                          Within 14 Days
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Document Footer */}
            <footer className="flex flex-col justify-between gap-4 border-t border-white/5 pt-8 text-xs font-mono text-white/70 sm:flex-row sm:items-center">
              <div>
                <span>ALIMERIQ Legal Protocol</span>
                <span className="mx-2">•</span>
                <span>Jurisdiction: {guide?.country_name || selectedCountry}</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hover:text-[#f2ca50] transition-colors inline-flex items-center gap-1.5 cursor-pointer text-white no-print"
                >
                  <Printer size={13} className="text-[#f2ca50]" />
                  <span>Save as PDF / Print</span>
                </button>
                <span className="text-white/30 no-print">|</span>
                <span className="text-white/80">Helpful Registration Guide</span>
              </div>
            </footer>
          </div>
          )}
        </section>
          )}
        </div>
      )}

        {activeMode === "filings" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <div><h2 className="font-serif text-2xl text-white">Start a registration request</h2><p className="mt-2 text-sm text-white/60">Submit your company or intellectual-property details for an Almeriq intake record. This is not a government filing or legal registration.</p></div>
              <form onSubmit={submitFiling} className="space-y-4 rounded border border-white/10 bg-white/[0.02] p-5">
                <label className="block space-y-2 text-sm"><span className="text-white/75">Request type</span><select value={filingForm.filing_type} onChange={(event) => setFilingForm((form) => ({ ...form, filing_type: event.target.value }))} className="w-full rounded border border-[#282a2f] bg-[#111318] p-3 text-white"><option value="company">Company registration guidance</option><option value="ip">Copyright / trademark guidance</option></select></label>
                {filingForm.filing_type === "company" ? <>
                  <label className="block space-y-2 text-sm"><span className="text-white/75">Proposed company name</span><input required maxLength={200} value={filingForm.company_name} onChange={(event) => setFilingForm((form) => ({ ...form, company_name: event.target.value }))} className="w-full rounded border border-[#282a2f] bg-[#111318] p-3 text-white" /></label>
                  <label className="block space-y-2 text-sm"><span className="text-white/75">Entity type</span><select value={filingForm.entity_type} onChange={(event) => setFilingForm((form) => ({ ...form, entity_type: event.target.value }))} className="w-full rounded border border-[#282a2f] bg-[#111318] p-3 text-white"><option>Ltd</option><option>LLC</option><option>Corporation</option><option>Sole Proprietor</option></select></label>
                  <label className="block space-y-2 text-sm"><span className="text-white/75">Country / jurisdiction</span><input required maxLength={120} value={filingForm.jurisdiction} onChange={(event) => setFilingForm((form) => ({ ...form, jurisdiction: event.target.value }))} placeholder={selectedCountry} className="w-full rounded border border-[#282a2f] bg-[#111318] p-3 text-white" /></label>
                </> : <>
                  <label className="block space-y-2 text-sm"><span className="text-white/75">Title of work / brand</span><input required maxLength={200} value={filingForm.ip_title} onChange={(event) => setFilingForm((form) => ({ ...form, ip_title: event.target.value }))} className="w-full rounded border border-[#282a2f] bg-[#111318] p-3 text-white" /></label>
                  <label className="block space-y-2 text-sm"><span className="text-white/75">What are you protecting?</span><select value={filingForm.ip_type} onChange={(event) => setFilingForm((form) => ({ ...form, ip_type: event.target.value }))} className="w-full rounded border border-[#282a2f] bg-[#111318] p-3 text-white"><option>Source Code</option><option>Logo</option><option>Company Name</option><option>Product Design</option><option>Written Content</option></select></label>
                  <label className="block space-y-2 text-sm"><span className="text-white/75">Description</span><textarea required maxLength={3000} rows={4} value={filingForm.ip_description} onChange={(event) => setFilingForm((form) => ({ ...form, ip_description: event.target.value }))} className="w-full rounded border border-[#282a2f] bg-[#111318] p-3 text-white" /></label>
                </>}
                {filingError && <p role="alert" className="text-sm text-red-300">{filingError}</p>}
                <button disabled={filingSaving} className="rounded bg-[#f2ca50] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50">{filingSaving ? "Submitting…" : "Submit intake request"}</button>
              </form>
            </section>
            <section className="space-y-4">
              <div><h2 className="font-serif text-2xl text-white">Your requests</h2><p className="mt-2 text-sm text-white/60">Reference numbers and submission history for your records.</p></div>
              {filingLoading ? <div className="space-y-3" aria-busy="true">{[0, 1].map((item) => <div key={item} className="space-y-3 rounded border border-border bg-surface p-4"><Skeleton className="h-4 w-1/3" /><SkeletonText lines={2} /></div>)}</div> : filings.length === 0 ? <div className="rounded border border-white/10 p-5 text-sm text-white/50">No registration requests yet.</div> : filings.map((filing) => <article key={filing.id} className="rounded border border-white/10 bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-white">{filing.filing_type === "company" ? filing.company_name : filing.ip_title}</strong><span className="text-xs text-[#f2ca50]">{filing.status}</span></div><p className="mt-1 text-xs text-white/50">{filing.ref_number} · {filing.filing_type === "company" ? filing.entity_type + " · " + filing.jurisdiction : filing.ip_type}</p><p className="mt-2 text-xs text-white/40">{filing.filed_at ? new Date(filing.filed_at).toLocaleString() : ""}</p><p className="mt-2 text-xs text-amber-200/70">Almeriq intake record only — no government application has been submitted.</p></article>)}
            </section>
          </div>
        )}
        {/* ── MODE 2: STARTER LEGAL TEMPLATES ── */}
        {activeMode === "templates" && (
          <div className="space-y-8">
            <div className="border-b border-white/10 pb-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#f2ca50] uppercase mb-2">
                <span className="h-0.5 w-2 bg-[#f2ca50]"></span> Starter Agreements
              </div>
              <h2 className="font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl">
                Starter Contracts and Legal Templates
              </h2>
              <p className="mt-2 text-sm font-normal text-white leading-relaxed max-w-3xl">
                Simple, standard agreements to protect your code, keep your ideas confidential, divide equity fairly among co-founders, and take early investment.
              </p>
              <p className="mt-3 max-w-3xl rounded border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">These are general starting points, not legal advice or ready-to-sign documents. Have a qualified lawyer adapt them to your company, country, and actual deal before use.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Template Rail */}
              <div className="overflow-hidden rounded border border-white/10 bg-white/[0.01] divide-y divide-white/5 lg:col-span-4">
                {LEGAL_TEMPLATES.map((tmpl) => {
                  const active = selectedTemplate.id === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`w-full p-4 text-left transition-colors cursor-pointer ${
                        active
                          ? "bg-white/[0.04] border-l-2 border-[#f2ca50]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono tracking-wider text-[#f2ca50] uppercase">
                          {tmpl.tag}
                        </span>
                      </div>
                      <h4 className="mt-1 text-sm font-semibold text-white">
                        {tmpl.title}
                      </h4>
                      <p className="mt-1 text-xs font-normal text-white/70 line-clamp-2 leading-relaxed">
                        {tmpl.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Template Preview Stage */}
              <div className="rounded border border-white/10 bg-white/[0.015] p-6 lg:col-span-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#f2ca50] uppercase tracking-wider">
                        {selectedTemplate.tag}
                      </span>
                      <h3 className="font-serif text-lg font-medium text-white mt-0.5">
                        {selectedTemplate.title}
                      </h3>
                      <p className="text-xs font-normal text-white mt-1">
                        {selectedTemplate.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copyTemplateContent}
                      className="inline-flex items-center justify-center gap-1.5 rounded bg-[#f2ca50] px-4 py-2 text-xs font-semibold text-black hover:bg-[#e2ba40] transition-all cursor-pointer shadow-sm shrink-0"
                    >
                      {copiedTemplate ? (
                        <Check size={14} className="text-black" />
                      ) : (
                        <Copy size={14} className="text-black" />
                      )}
                      <span>{copiedTemplate ? "Copied" : "Copy Template"}</span>
                    </button>
                  </div>

                  <div className="mt-4">
                    <pre className="max-h-[500px] overflow-y-auto rounded border border-white/5 bg-[#090a0d] p-5 text-xs font-mono leading-relaxed text-white whitespace-pre-wrap selection:bg-[#f2ca50]/20 selection:text-[#f2ca50]">
                      {selectedTemplate.content}
                    </pre>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-xs font-mono text-white/70">
                  <span>Standard Founder Contract Format</span>
                  <span className="text-[#f2ca50]">Ready to Use</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FounderFlowGuard>
  );
}
