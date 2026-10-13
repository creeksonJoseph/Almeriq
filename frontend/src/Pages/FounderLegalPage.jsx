import React, { useState, useEffect } from "react";
import {
  Scale,
  Building2,
  ShieldCheck,
  FileText,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";
import FounderStudioNav from "../components/founder/FounderStudioNav";
import { FounderFlowGuard } from "../components/founder/FounderFlowLayout";
import { listLegalFilingsApi, createLegalFilingApi } from "../lib/api";
import { useToast } from "../context/ToastContext";

const LEGAL_TEMPLATES = [
  {
    id: "nda",
    title: "Mutual Non-Disclosure Agreement (NDA)",
    desc: "Standard bilateral agreement for investor meetings, contractor discussions, and co-founder exploration.",
    content: `MUTUAL NON-DISCLOSURE AGREEMENT

1. PURPOSE: The parties wish to explore a potential business relationship concerning startup development and venture operations.
2. CONFIDENTIAL INFORMATION: Includes all technical, financial, customer, product, and strategy data disclosed directly or indirectly.
3. OBLIGATIONS: The receiving party shall hold all information in strict confidence and use it solely to evaluate the relationship.
4. TERM: This Agreement remains in effect for 2 years from date of disclosure.
5. GOVERNING LAW: Governed by local commercial arbitration codes.`,
  },
  {
    id: "ip_assignment",
    title: "Proprietary Information & Inventions Assignment (PIIA)",
    desc: "Ensures all code, designs, and intellectual property developed by founders and contractors belong strictly to the corporate entity.",
    content: `INVENTIONS & PROPRIETARY INFORMATION AGREEMENT

1. ASSIGNMENT OF INVENTIONS: The contributor irrevocably assigns to the Company all right, title, and interest in all inventions, software code, designs, and documentation created during engagement.
2. WORK FOR HIRE: All copyrightable material shall be deemed a "work made for hire."
3. NO PRIOR RESTRICTIONS: Contributor warrants that work performed does not breach any prior employment or non-compete agreements.`,
  },
  {
    id: "safe",
    title: "Simple Agreement for Future Equity (SAFE)",
    desc: "Standard pre-money valuation cap SAFE for angel investments and early accelerator checks.",
    content: `SIMPLE AGREEMENT FOR FUTURE EQUITY (SAFE)

1. INVESTMENT: Investor pays the Purchase Amount in exchange for the right to shares upon an Equity Financing event.
2. VALUATION CAP: Negotiated pre-money valuation cap applies on conversion.
3. DISCOUNT RATE: 20% standard discount or valuation cap (whichever yields lower price per share).
4. LIQUIDITY EVENT: Investor receives cash payout or common stock conversion upon acquisition or IPO.`,
  },
];

export default function FounderLegalPage() {
  const { showToast } = useToast();
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("filings"); // "filings" | "new_company" | "new_ip" | "templates"

  // Company Filing Form State
  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    entity_type: "Private Limited Company (Ltd)",
    jurisdiction: "Kenya",
  });

  // IP Filing Form State
  const [ipForm, setIpForm] = useState({
    ip_title: "",
    ip_type: "Software Codebase & Algorithm",
    ip_description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(LEGAL_TEMPLATES[0]);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await listLegalFilingsApi();
        if (Array.isArray(data)) {
          setFilings(data);
        }
      } catch (err) {
        // default
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateCompanyFiling = async (e) => {
    e.preventDefault();
    if (!companyForm.company_name.trim()) {
      showToast("Please enter a proposed company name", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createLegalFilingApi({
        filing_type: "company",
        company_name: companyForm.company_name,
        entity_type: companyForm.entity_type,
        jurisdiction: companyForm.jurisdiction,
      });
      setFilings([res, ...filings]);
      showToast(`Company registration filed successfully! Ref: ${res.ref_number}`, "success");
      setCompanyForm({ company_name: "", entity_type: "Private Limited Company (Ltd)", jurisdiction: "Kenya" });
      setActiveTab("filings");
    } catch (err) {
      showToast(err.message || "Filing failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIpFiling = async (e) => {
    e.preventDefault();
    if (!ipForm.ip_title.trim()) {
      showToast("Please enter the title of your intellectual property", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createLegalFilingApi({
        filing_type: "ip",
        ip_title: ipForm.ip_title,
        ip_type: ipForm.ip_type,
        ip_description: ipForm.ip_description,
      });
      setFilings([res, ...filings]);
      showToast(`IP registration record created! Ref: ${res.ref_number}`, "success");
      setIpForm({ ip_title: "", ip_type: "Software Codebase & Algorithm", ip_description: "" });
      setActiveTab("filings");
    } catch (err) {
      showToast(err.message || "Filing failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyTemplateContent = () => {
    if (!selectedTemplate) return;
    navigator.clipboard.writeText(selectedTemplate.content);
    setCopiedTemplate(true);
    showToast("Legal template copied to clipboard", "success");
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <FounderFlowGuard>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FounderStudioNav
          title="Legal & Compliance Vault"
          subtitle="Register your corporate entity, protect intellectual property, and access standard legal contracts."
        />

        {/* Action Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#2B2B31] pb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("filings")}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeTab === "filings"
                  ? "bg-[#C9A15A]/15 text-[#E8D6A8] border border-[#C9A15A]/30"
                  : "text-[#9B9A94] hover:bg-[#1C1C21] hover:text-white"
              }`}
            >
              Active Filings ({filings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("new_company")}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeTab === "new_company"
                  ? "bg-[#C9A15A]/15 text-[#E8D6A8] border border-[#C9A15A]/30"
                  : "text-[#9B9A94] hover:bg-[#1C1C21] hover:text-white"
              }`}
            >
              + File Company Entity
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("new_ip")}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeTab === "new_ip"
                  ? "bg-[#C9A15A]/15 text-[#E8D6A8] border border-[#C9A15A]/30"
                  : "text-[#9B9A94] hover:bg-[#1C1C21] hover:text-white"
              }`}
            >
              + File IP / Trademark
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeTab === "templates"
                  ? "bg-[#C9A15A]/15 text-[#E8D6A8] border border-[#C9A15A]/30"
                  : "text-[#9B9A94] hover:bg-[#1C1C21] hover:text-white"
              }`}
            >
              Legal Templates
            </button>
          </div>
        </div>

        {/* TAB 1: FILINGS LIST */}
        {activeTab === "filings" && (
          <div>
            {loading && (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#C9A15A]" />
              </div>
            )}

            {!loading && filings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#2B2B31] bg-[#141417]/50 p-12 text-center">
                <Scale size={32} className="mx-auto text-[#5F5E5A]" />
                <h4 className="mt-3 font-display text-base font-semibold text-[#F3F1EC]">
                  No active filings on record
                </h4>
                <p className="mt-1 text-xs text-[#9B9A94]">
                  Initiate a company registration or intellectual property filing to generate an Alimeriq legal tracking number.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("new_company")}
                    className="rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] px-4 py-2 text-xs font-semibold text-[#0A0A0B]"
                  >
                    File Company Registration
                  </button>
                </div>
              </div>
            )}

            {!loading && filings.length > 0 && (
              <div className="space-y-3">
                {filings.map((filing) => (
                  <div
                    key={filing.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-[#2B2B31] bg-[#141417] p-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2B2B31] bg-[#1C1C21] text-[#C9A15A]">
                        {filing.filing_type === "company" ? <Building2 size={20} /> : <ShieldCheck size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm font-bold text-[#F3F1EC]">
                            {filing.filing_type === "company" ? filing.company_name : filing.ip_title}
                          </h4>
                          <span className="rounded bg-[#1C1C21] px-2 py-0.5 text-[10px] font-mono font-medium text-[#C9A15A]">
                            {filing.ref_number}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#9B9A94]">
                          {filing.filing_type === "company"
                            ? `${filing.entity_type} · Jurisdiction: ${filing.jurisdiction}`
                            : `${filing.ip_type} · ${filing.ip_description || "Protected codebase"}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3E8368]/30 bg-[#3E8368]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#52b788]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#52b788]" />
                        {filing.status}
                      </span>
                      <span className="text-[11px] text-[#5F5E5A]">
                        Filed {new Date(filing.filed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NEW COMPANY FILING */}
        {activeTab === "new_company" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#2B2B31] bg-[#141417] p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-[#2B2B31] pb-4">
              <Building2 size={22} className="text-[#C9A15A]" />
              <div>
                <h3 className="font-display text-lg font-bold text-[#F3F1EC]">
                  File Company Entity Registration
                </h3>
                <p className="text-xs text-[#9B9A94]">
                  Generates an official Alimeriq tracking docket and prepares statutory incorporation papers.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCompanyFiling} className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#F3F1EC]">Proposed Legal Company Name</label>
                  <span className={`text-xs font-medium ${
                    companyForm.company_name.length > 100
                      ? "text-red-400"
                      : companyForm.company_name.length > 80
                        ? "text-yellow-400"
                        : "text-white/45"
                  }`}>
                    {companyForm.company_name.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  placeholder="e.g. Alimeriq Logistics Technologies Ltd"
                  className="mt-1.5 w-full rounded-xl border border-[#2B2B31] bg-[#1C1C21] px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#C9A15A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#F3F1EC]">Entity Type</label>
                <select
                  value={companyForm.entity_type}
                  onChange={(e) => setCompanyForm({ ...companyForm, entity_type: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#2B2B31] bg-[#1C1C21] px-4 py-2.5 text-xs text-white focus:border-[#C9A15A] focus:outline-none"
                >
                  <option value="Private Limited Company (Ltd)">Private Limited Company (Ltd)</option>
                  <option value="Delaware C-Corporation">Delaware C-Corporation (US Venture Backed)</option>
                  <option value="Limited Liability Company (LLC)">Limited Liability Company (LLC)</option>
                  <option value="UK Private Limited">UK Private Limited (Gov.uk)</option>
                  <option value="Rwanda Special Economic Zone Co">Rwanda Kigali Financial Centre Entity</option>
                  <option value="UAE Freezone Entity">UAE / DIFC Freezone Co</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#F3F1EC]">Primary Operating Jurisdiction</label>
                  <span className={`text-xs font-medium ${
                    companyForm.jurisdiction.length > 60
                      ? "text-red-400"
                      : companyForm.jurisdiction.length > 50
                        ? "text-yellow-400"
                        : "text-white/45"
                  }`}>
                    {companyForm.jurisdiction.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={companyForm.jurisdiction}
                  onChange={(e) => setCompanyForm({ ...companyForm, jurisdiction: e.target.value })}
                  placeholder="e.g. Kenya, Delaware, Nigeria, United Kingdom"
                  className="mt-1.5 w-full rounded-xl border border-[#2B2B31] bg-[#1C1C21] px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#C9A15A] focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] py-3 text-xs font-bold text-[#0A0A0B] shadow-md transition-all hover:scale-[1.01] disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>{submitting ? "Submitting Filing..." : "Generate Filing & Reference Number"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: NEW IP FILING */}
        {activeTab === "new_ip" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#2B2B31] bg-[#141417] p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-[#2B2B31] pb-4">
              <ShieldCheck size={22} className="text-[#C9A15A]" />
              <div>
                <h3 className="font-display text-lg font-bold text-[#F3F1EC]">
                  Intellectual Property & Copyright Filing
                </h3>
                <p className="text-xs text-[#9B9A94]">
                  Create an auditable timestamped record of algorithms, software IP, trademarks, and trade secrets.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateIpFiling} className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#F3F1EC]">Asset / Innovation Title</label>
                  <span className={`text-xs font-medium ${
                    ipForm.ip_title.length > 100
                      ? "text-red-400"
                      : ipForm.ip_title.length > 80
                        ? "text-yellow-400"
                        : "text-white/45"
                  }`}>
                    {ipForm.ip_title.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={ipForm.ip_title}
                  onChange={(e) => setIpForm({ ...ipForm, ip_title: e.target.value })}
                  placeholder="e.g. Alimeriq Autonomous Freight Dispatch Engine v1.0"
                  className="mt-1.5 w-full rounded-xl border border-[#2B2B31] bg-[#1C1C21] px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#C9A15A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#F3F1EC]">IP Classification</label>
                <select
                  value={ipForm.ip_type}
                  onChange={(e) => setIpForm({ ...ipForm, ip_type: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#2B2B31] bg-[#1C1C21] px-4 py-2.5 text-xs text-white focus:border-[#C9A15A] focus:outline-none"
                >
                  <option value="Software Codebase & Algorithm">Software Codebase & Proprietary Algorithm</option>
                  <option value="Brand Trademark & Logo">Brand Trademark, Logo & Trade Dress</option>
                  <option value="Hardware Architecture & Schematics">Hardware Architecture & Schematics</option>
                  <option value="Proprietary Training Dataset">Proprietary Training Dataset & Weights</option>
                  <option value="Trade Secret & Operations Methodology">Trade Secret & Operations Methodology</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#F3F1EC]">Technical Description & Claim</label>
                  <span className={`text-xs font-medium ${
                    ipForm.ip_description.length > 450
                      ? "text-red-400"
                      : ipForm.ip_description.length > 400
                        ? "text-yellow-400"
                        : "text-white/45"
                  }`}>
                    {ipForm.ip_description.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={ipForm.ip_description}
                  onChange={(e) => setIpForm({ ...ipForm, ip_description: e.target.value })}
                  placeholder="Briefly describe what makes this invention novel and its key components..."
                  className="mt-1.5 w-full rounded-xl border border-[#2B2B31] bg-[#1C1C21] px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#C9A15A] focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A15A] to-[#E8D6A8] py-3 text-xs font-bold text-[#0A0A0B] shadow-md transition-all hover:scale-[1.01] disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>{submitting ? "Registering IP..." : "Register IP & Issue Docket"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: LEGAL TEMPLATES */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              {LEGAL_TEMPLATES.map((tmpl) => {
                const active = selectedTemplate.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-[#C9A15A] bg-[#C9A15A]/10 text-white"
                        : "border-[#2B2B31] bg-[#141417] text-[#9B9A94] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <h5 className="text-xs font-bold text-[#F3F1EC]">{tmpl.title}</h5>
                    <p className="mt-1 text-[11px] text-[#9B9A94] line-clamp-2">{tmpl.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[#2B2B31] bg-[#141417] p-6 md:col-span-2">
              <div className="flex items-center justify-between border-b border-[#2B2B31] pb-4">
                <div>
                  <h4 className="font-display text-base font-bold text-[#F3F1EC]">
                    {selectedTemplate.title}
                  </h4>
                  <p className="text-xs text-[#9B9A94]">{selectedTemplate.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={copyTemplateContent}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2B2B31] bg-[#1C1C21] px-3 py-1.5 text-xs font-semibold text-[#E8D6A8] hover:bg-white/5"
                >
                  {copiedTemplate ? <Check size={14} className="text-[#3E8368]" /> : <Copy size={14} />}
                  <span>{copiedTemplate ? "Copied" : "Copy Template"}</span>
                </button>
              </div>

              <pre className="mt-5 max-h-96 overflow-y-auto rounded-xl border border-[#2B2B31] bg-[#0A0A0B] p-4 text-xs font-mono leading-relaxed text-[#9B9A94] whitespace-pre-wrap">
                {selectedTemplate.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </FounderFlowGuard>
  );
}
