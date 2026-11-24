import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input, Skeleton, SkeletonText } from "../../components/ui";
import { useInvestorWorkspace } from "../../hooks/useInvestorWorkspace";

const DEAL_ROOM_TEMPLATES = [{"title":"Mutual NDA","description":"Confidentiality terms for founders and prospective investors.","body":"MUTUAL NON-DISCLOSURE AGREEMENT\n\nDate: [DATE]\n\nParties: [FOUNDER / COMPANY LEGAL NAME] and [INVESTOR LEGAL NAME]\n\nPurpose. The parties may exchange confidential information solely to evaluate a potential investment or business relationship (the Purpose).\n\nConfidential Information. Includes non-public business, product, technical, financial, customer, operational and strategic information disclosed in any form, excluding information the recipient can show was public without breach, already lawfully known, independently developed, or lawfully received without confidentiality duty.\n\nRecipient obligations. The recipient will use the information only for the Purpose, protect it with reasonable care, and disclose it only to representatives who need to know and are bound by confidentiality obligations.\n\nRequired disclosure. A recipient may disclose information where legally required, giving notice where lawful.\n\nTerm. Confidentiality obligations continue for [2] years from disclosure; trade secrets remain protected while legally qualifying as trade secrets.\n\nNo licence or obligation. No intellectual-property licence is granted and neither party is required to proceed with a transaction.\n\nReturn / destruction. On written request, return or destroy confidential information subject to lawful archival copies.\n\nGoverning law: [JURISDICTION]\n\nSigned: ____________________  Date: __________\n[FOUNDER / COMPANY]\n\nSigned: ____________________  Date: __________\n[INVESTOR]\n\nSTARTER TEMPLATE ONLY. Obtain legal review and tailor to the governing law."},{"title":"Founder Agreement","description":"Outline founder roles, equity intentions and decision-making.","body":"FOUNDERS' AGREEMENT — DISCUSSION DRAFT\n\nCompany: [COMPANY NAME / FORMATION STATUS]\nDate: [DATE]\nFounders: [FULL LEGAL NAMES]\n\n1. Purpose and business. The founders intend to build [BUSINESS DESCRIPTION].\n\n2. Roles and time commitment. [FOUNDER A: ROLE / COMMITMENT]. [FOUNDER B: ROLE / COMMITMENT].\n\n3. Proposed ownership. [FOUNDER A: %]. [FOUNDER B: %]. These are proposed allocations only until properly approved, documented and issued under applicable law.\n\n4. Vesting and leaver terms. [VESTING SCHEDULE, CLIFF, GOOD-LEAVER / BAD-LEAVER TERMS].\n\n5. Intellectual property. Each founder will identify relevant pre-existing IP and agree in a separate written instrument how company-related IP is assigned or licensed to the company.\n\n6. Decisions. Ordinary decisions: [PROCESS]. Reserved matters requiring consent: [LIST].\n\n7. Expenses and compensation. [APPROVAL AND REIMBURSEMENT RULES].\n\n8. Confidentiality and conflicts. Founders will protect company confidential information and disclose material conflicts.\n\n9. Departure and dispute resolution. [NOTICE, BUYBACK / TRANSFER, MEDIATION AND DISPUTE PROCESS].\n\n10. Governing law: [JURISDICTION]\n\nAcknowledged for discussion: ____________________ [FOUNDER] Date: ______\nAcknowledged for discussion: ____________________ [FOUNDER] Date: ______\n\nDISCUSSION DRAFT ONLY. It does not issue shares or replace constitutional, employment, IP-assignment or shareholder documents. Obtain independent legal and tax advice."},{"title":"Term Sheet","description":"Capture proposed investment economics and key conditions.","body":"NON-BINDING INVESTMENT TERM SHEET\n\nDate: [DATE]\nCompany: [LEGAL NAME / JURISDICTION]\nInvestor: [LEGAL NAME]\nRound: [PRE-SEED / SEED / SERIES A / OTHER]\n\nInvestment amount: [CURRENCY AND AMOUNT]\nInstrument: [EQUITY / SAFE / CONVERTIBLE NOTE / OTHER]\nPre-money valuation: [AMOUNT OR NOT APPLICABLE]\nPost-money valuation: [AMOUNT OR NOT APPLICABLE]\nProposed ownership / conversion mechanics: [DETAILS]\nUse of proceeds: [DETAILS]\nBoard / observer rights: [DETAILS]\nInformation rights: [DETAILS]\nPro-rata / participation rights: [DETAILS]\nConditions precedent: [DUE DILIGENCE, APPROVALS, DEFINITIVE DOCUMENTS]\nTarget closing date: [DATE]\nExclusivity (if any): [PERIOD / NONE]\n\nNon-binding effect. This term sheet records current discussion points only. No party is obliged to complete the investment until definitive agreements are negotiated, approved and signed.\n\nPotential binding clauses (only if expressly selected and legally reviewed): confidentiality, exclusivity, expenses, governing law and dispute resolution. Mark each clause intended to bind: [SPECIFY].\n\nGoverning law for any expressly binding clauses: [JURISDICTION]\n\nAcknowledged for discussion: ____________________ [COMPANY] Date: ______\nAcknowledged for discussion: ____________________ [INVESTOR] Date: ______\n\nSTARTER TEMPLATE ONLY. Investment terms and securities laws vary; obtain qualified legal advice."}];

export default function InvestorDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const pathname = location.pathname;
  const pageView = pathname.includes("/startups") ? "startups" : pathname.includes("/deals") ? "deals" : pathname.includes("/portfolio") ? "portfolio" : pathname.includes("/analytics") ? "analytics" : pathname.includes("/resources") ? "resources" : pathname.includes("/settings") ? "settings" : "overview";
  const workspace = useInvestorWorkspace({ navigate });
  const {
    profile, setProfile, startups, requests, loading, busyPitch,
    error, notice, settingsSaving, saveSettings,
    openConversation, savePortfolio, expressInterest,
  } = workspace;
  const signatureCanvasRef = useRef(null);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [confirmationStep, setConfirmationStep] = useState(1);
  const [startupQuery, setStartupQuery] = useState("");
  const [portfolioForm, setPortfolioForm] = useState({ investment_amount: "", current_value: "", ownership_percent: "", investment_date: "", notes: "", risk_level: "medium", payment_method: "visa", signature_data: "" });

  useEffect(() => {
    const preferredMethod = profile?.preferred_payment_methods?.[0];
    if (preferredMethod) setPortfolioForm((current) => ({ ...current, payment_method: preferredMethod }));
  }, [profile?.preferred_payment_methods]);
  const activeOpportunityId = params.pitchId ? Number(params.pitchId) : null;
  const activeDealId = params.dealId ? Number(params.dealId) : null;

  const handleSignaturePointerDown = (event) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const context = canvas.getContext("2d");
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
    canvas.setPointerCapture(event.pointerId);
  };

  const handleSignaturePointerMove = (event) => {
    if (event.buttons !== 1) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    context.lineTo((event.clientX - rect.left) * (canvas.width / rect.width), (event.clientY - rect.top) * (canvas.height / rect.height));
    context.stroke();
    setPortfolioForm((form) => ({ ...form, signature_data: canvas.toDataURL("image/png") }));
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setPortfolioForm((form) => ({ ...form, signature_data: "" }));
    setEditingInvestment((current) => current ? { ...current, signature_data: null } : current);
  };

  const beginPortfolioEdit = (request) => {
    setEditingInvestment(request);
    setConfirmationStep(1);
    setPortfolioForm({
      investment_amount: request.investment_amount ?? request.amount ?? "",
      current_value: request.current_value ?? "",
      ownership_percent: request.ownership_percent ?? "",
      investment_date: request.investment_date || "",
      notes: request.notes || "",
      risk_level: request.risk_level || "medium",
      payment_method: request.payment_method || "visa",
      signature_data: request.signature_data || "",
    });
  };

  if (loading) return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10" aria-label="Loading investor workspace" aria-busy="true">
      <div className="space-y-3"><Skeleton className="h-3 w-36" /><Skeleton className="h-9 w-72" /><Skeleton className="h-4 w-full max-w-2xl" /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <Card key={item} className="space-y-3 p-4"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-7 w-1/3" /><Skeleton className="h-3 w-2/3" /></Card>)}</div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3"><Card className="space-y-4 p-5 xl:col-span-2"><Skeleton className="h-6 w-1/3" /><SkeletonText lines={5} /></Card><Card className="space-y-4 p-5"><Skeleton className="h-6 w-1/2" /><SkeletonText lines={5} /></Card></div>
      <Card className="space-y-4 p-5"><Skeleton className="h-6 w-1/3" />{[0, 1, 2, 3].map((item) => <div key={item} className="flex gap-3"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /></div>)}</Card>
    </main>
  );

  const requestedPitchIds = new Set(requests.map((request) => request.pitch_id));
  const investedItems = requests.filter((request) => request.status === "invested" && Number(request.investment_amount) > 0);
  const valuedItems = investedItems.filter((request) => request.current_value != null);
  const totalInvested = investedItems.reduce((sum, item) => sum + Number(item.investment_amount || 0), 0);
  const valuedInvested = valuedItems.reduce((sum, item) => sum + Number(item.investment_amount || 0), 0);
  const currentPortfolioValue = valuedItems.reduce((sum, item) => sum + Number(item.current_value || 0), 0);
  const portfolioRoi = valuedInvested > 0 ? ((currentPortfolioValue - valuedInvested) / valuedInvested) * 100 : null;
  const returnAssumption = profile?.target_return_percent == null ? null : Number(profile.target_return_percent);
  const projectedValue = returnAssumption == null || currentPortfolioValue <= 0 ? null : currentPortfolioValue * (1 + returnAssumption / 100);
  const stageExposure = investedItems.reduce((groups, item) => {
    const stage = item.pitch?.stage || "Unspecified";
    groups[stage] = (groups[stage] || 0) + Number(item.investment_amount || 0);
    return groups;
  }, {});
  const maxStageExposure = Math.max(1, ...Object.values(stageExposure));
  const riskExposure = investedItems.reduce((groups, item) => { const level = ["low", "medium", "high"].includes(item.risk_level) ? item.risk_level : "unclassified"; groups[level] = (groups[level] || 0) + Number(item.investment_amount || 0); return groups; }, {});
  const riskTotal = Object.values(riskExposure).reduce((sum, amount) => sum + amount, 0);
  const documentedStartups = startups.filter((pitch) => pitch.website_url || pitch.pitch_deck_url || pitch.financials_url || (pitch.documents || []).length > 0);
  const visibleStartups = startups.filter((pitch) =>
    [pitch.title, pitch.summary, pitch.sector, pitch.stage, pitch.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(startupQuery.trim().toLowerCase()) && (!params.pitchId || pitch.id === Number(params.pitchId)),
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav aria-label="Investor workspace" className="flex flex-wrap gap-2 border-b border-white/10 pb-3 text-sm">{[["overview","Overview","/investor/dashboard"],["startups","Discover startups","/investor/startups"],["deals","Deal pipeline","/investor/deals"],["portfolio","Portfolio","/investor/portfolio"],["analytics","Analytics","/investor/analytics"],["resources","Documents & templates","/investor/resources"],["settings","Settings","/investor/settings"]].map(([key,label,path]) => <button key={key} type="button" onClick={() => navigate(path)} className={"rounded-lg px-3 py-2 transition-colors " + (pageView === key ? "bg-[#C9A15A]/15 text-[#E8D6A8]" : "text-white/60 hover:bg-white/5 hover:text-white")}>{label}</button>)}</nav>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-widest text-[#C9A15A]">Investor workspace</p><h1 className="mt-2 font-serif text-3xl">Investor Dashboard</h1><p className="mt-2 text-sm text-white/60">Discover startups and manage founder conversations.</p></div>
          <Button className="bg-[#C9A15A] text-[#111318] hover:bg-[#E8D6A8]" onClick={() => navigate("/investor/profile")}>{profile ? "Edit Profile" : "Complete Profile"}</Button>
        </header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
        {!profile?.firm_name && <Card className="border border-[#C9A15A]/20 bg-[#C9A15A]/5 p-4 text-sm text-white/70">Complete your investor profile so founders can understand your investment focus.</Card>}
        {["overview", "portfolio", "analytics"].includes(pageView) && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl">{pageView === "analytics" ? "Portfolio analytics" : pageView === "overview" ? "Investor overview" : "Portfolio"}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4"><p className="text-xs text-white/45">Recorded investments</p><p className="mt-2 text-2xl font-semibold">{investedItems.length}</p></Card>
            <Card className="p-4"><p className="text-xs text-white/45">Amount invested</p><p className="mt-2 text-2xl font-semibold">{totalInvested.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-xs text-white/45">Current value (valued positions)</p><p className="mt-2 text-2xl font-semibold">{currentPortfolioValue.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-xs text-white/45">ROI on valued positions</p><p className="mt-2 text-2xl font-semibold">{portfolioRoi == null ? "—" : portfolioRoi.toFixed(1) + "%"}</p></Card>
          </div>
          {pageView === "portfolio" && projectedValue != null && <Card className="p-4"><p className="text-xs text-white/45">Illustrative 12-month value projection</p><p className="mt-2 text-xl font-semibold">{projectedValue.toLocaleString()}</p><p className="mt-1 text-xs text-white/45">Uses your self-entered {returnAssumption}% annual return assumption; not a forecast or guarantee.</p></Card>}
          {pageView === "analytics" && Object.keys(stageExposure).length > 0 && <Card className="p-4"><h3 className="font-medium">Portfolio stage exposure</h3><div className="mt-3 space-y-2">{Object.entries(stageExposure).map(([stage, amount]) => <div key={stage} className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="text-white/65">{stage}</span><span>{amount.toLocaleString()}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#C9A15A]" style={{ width: (amount / maxStageExposure * 100) + "%" }} /></div></div>)}</div><p className="mt-2 text-xs text-white/40">Stage exposure is a simple portfolio breakdown, not a formal risk rating.</p></Card>}
          {pageView === "analytics" && investedItems.length > 0 && <Card className="p-4"><h3 className="font-medium">Risk distribution</h3><div className="mt-3 space-y-2">{["low", "medium", "high", "unclassified"].filter((level) => riskExposure[level]).map((level) => <div key={level} className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="capitalize text-white/65">{level}</span><span>{riskTotal > 0 ? (riskExposure[level] / riskTotal * 100).toFixed(0) : 0}% · {riskExposure[level].toLocaleString()}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#C9A15A]" style={{ width: (riskExposure[level] / Math.max(1, riskTotal) * 100) + "%" }} /></div></div>)}</div><p className="mt-2 text-xs text-white/40">Based on your own risk labels for each portfolio entry; Almeriq does not assess investment risk.</p></Card>}
          {pageView === "portfolio" && <div className="space-y-3 border-t border-white/10 pt-4">
            <h3 className="font-serif text-xl">Portfolio positions</h3>
            {investedItems.length === 0 ? <Card className="p-5 text-sm text-white/50">You have not recorded any investment positions yet.</Card> : investedItems.map((item) => {
              const pitch = item.pitch || startups.find((startup) => startup.id === item.pitch_id);
              return <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div><h4 className="font-medium">{pitch?.title || "Startup pitch #" + item.pitch_id}</h4><p className="mt-1 text-xs text-white/50">Recorded amount: {Number(item.investment_amount || 0).toLocaleString()} · Status: {item.status}</p>{item.current_value != null && <p className="mt-1 text-xs text-white/45">Current value: {Number(item.current_value).toLocaleString()}</p>}</div>
                <Button size="sm" variant="ghost" onClick={() => navigate("/investor/deals/" + item.id)}>Open deal room</Button>
              </Card>;
            })}
          </div>}
          {pageView !== "analytics" && <p className="text-xs text-white/40">Portfolio figures are manually recorded by you. Almeriq does not process or verify investment transfers.</p>}
        </section>

        
        )}

        {pageView === "settings" && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl">Investor settings</h2>
          <Card className="space-y-4 border border-white/10 bg-white/2 p-5">
            <div><h3 className="text-sm font-medium">Preferred payment methods</h3><p className="mt-1 text-xs text-white/45">Preferences only. Almeriq does not store card, bank or mobile-money credentials.</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">{[["paypal","PayPal"],["mastercard","Mastercard"],["visa","Visa"],["mpesa","M-Pesa"]].map(([value,label]) => <label key={value} className="flex items-center gap-2"><input type="checkbox" checked={(profile?.preferred_payment_methods || []).includes(value)} onChange={(event) => setProfile((current) => ({ ...current, preferred_payment_methods: event.target.checked ? [...(current?.preferred_payment_methods || []), value] : (current?.preferred_payment_methods || []).filter((method) => method !== value) }))} />{label}</label>)}</div>
            </div>
            <div className="border-t border-white/10 pt-4"><h3 className="text-sm font-medium">Notifications</h3><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">{[["notify_deal_updates","Investment updates"],["notify_messages","Messages"]].map(([key,label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(profile?.[key])} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</div></div>
            <div className="flex justify-end"><Button disabled={settingsSaving || !profile} onClick={saveSettings}>{settingsSaving ? "Saving…" : "Save preferences"}</Button></div>
          </Card>
        </section>

        
        )}

        {pageView === "startups" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-xl">Startup discovery</h2><span className="text-xs text-white/40">{visibleStartups.length} pitches</span></div>
          <Input value={startupQuery} onChange={(event) => setStartupQuery(event.target.value)} placeholder="Search startups, sectors or stages…" />
          {startups.length === 0 ? <Card className="border border-white/10 bg-white/2 p-6 text-sm text-white/50">No startup pitches are available yet.</Card> : visibleStartups.length === 0 ? <Card className="border border-white/10 bg-white/2 p-6 text-sm text-white/50">No pitches match that search.</Card> : visibleStartups.map((pitch) => (
            <Card key={pitch.id} className="border border-white/10 bg-white/2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1"><h3 className="font-medium text-white">{pitch.title}</h3><p className="mt-1 text-xs text-[#C9A15A]">{pitch.sector || "Sector not specified"} · {pitch.stage || "Stage not specified"}</p><p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{pitch.summary || "The founder hasn't added a summary yet."}</p>{pitch.ask_amount != null && <p className="mt-3 text-sm text-white/60">Funding round ask: {Number(pitch.ask_amount).toLocaleString()}</p>}{pitch.target_check_size != null && <p className="mt-1 text-sm text-white/60">Target investor check: {Number(pitch.target_check_size).toLocaleString()}</p>}{pitch.match_score != null && <p className="mt-2 text-xs text-emerald-200">{pitch.match_score}% match · {(pitch.match_reasons || []).join(" · ")}</p>}{pitch.traction && <p className="mt-2 text-sm text-white/55">Traction: {pitch.traction}</p>}{pitch.team_summary && <p className="mt-2 text-sm text-white/55">Team: {pitch.team_summary}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs">{pitch.website_url && <a className="text-[#C9A15A] underline" href={pitch.website_url} target="_blank" rel="noreferrer">Website</a>}{pitch.pitch_deck_url && <a className="text-[#C9A15A] underline" href={pitch.pitch_deck_url} target="_blank" rel="noreferrer">Pitch deck</a>}{pitch.financials_url && <a className="text-[#C9A15A] underline" href={pitch.financials_url} target="_blank" rel="noreferrer">Financials</a>}{(pitch.documents || []).map((doc, index) => <a key={index} className="text-[#C9A15A] underline" href={doc.url} target="_blank" rel="noreferrer">{doc.title}</a>)}</div></div>
                <div className="flex flex-col gap-2"><Button size="sm" variant="ghost" onClick={() => navigate(activeOpportunityId === pitch.id ? "/investor/startups" : `/investor/startups/${pitch.id}`)}>{activeOpportunityId === pitch.id ? "Back to discovery" : "View opportunity"}</Button><Button size="sm" disabled={requestedPitchIds.has(pitch.id) || busyPitch === pitch.id} onClick={() => expressInterest(pitch)}>{requestedPitchIds.has(pitch.id) ? "Interest sent" : busyPitch === pitch.id ? "Sending…" : "Express interest"}</Button></div>
              </div>
              {activeOpportunityId === pitch.id && <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2"><div className="space-y-2"><h4 className="text-sm font-medium">Company profile</h4><p className="text-sm text-white/65">{pitch.summary || "No company summary supplied."}</p>{pitch.location && <p className="text-xs text-white/45">Location: {pitch.location}</p>}{pitch.ask_amount != null && <p className="text-sm text-white/55">Funding round ask: {Number(pitch.ask_amount).toLocaleString()}</p>}{pitch.target_check_size != null && <p className="text-sm text-white/55">Target investor check: {Number(pitch.target_check_size).toLocaleString()}</p>}</div><div className="space-y-2"><h4 className="text-sm font-medium">Traction, team & materials</h4><p className="text-sm text-white/55">{pitch.traction || "No traction details supplied."}</p><p className="text-sm text-white/55">{pitch.team_summary || "No team summary supplied."}</p><div className="flex flex-wrap gap-3 text-sm">{pitch.website_url && <a className="text-[#C9A15A] underline" href={pitch.website_url} target="_blank" rel="noreferrer">Website</a>}{pitch.pitch_deck_url && <a className="text-[#C9A15A] underline" href={pitch.pitch_deck_url} target="_blank" rel="noreferrer">Pitch deck</a>}{pitch.financials_url && <a className="text-[#C9A15A] underline" href={pitch.financials_url} target="_blank" rel="noreferrer">Financials</a>}{(pitch.documents || []).map((doc,index) => <a key={index} className="text-[#C9A15A] underline" href={doc.url} target="_blank" rel="noreferrer">{doc.title}</a>)}</div></div></div>}
            </Card>
          ))}
        </section>

        
        )}

        {pageView === "resources" && (
        <section className="space-y-3">
          <div><h2 className="font-serif text-xl">Deal room resources</h2><p className="mt-1 text-sm text-white/50">Starter documents for reviewing a potential investment. Download, edit and have counsel review before use.</p></div>
          <div className="grid gap-3 md:grid-cols-3">
            {DEAL_ROOM_TEMPLATES.map(({ title, description, body }) => <Card key={title} className="space-y-3 border border-white/10 bg-white/2 p-4"><div><h3 className="font-medium">{title}</h3><p className="mt-1 text-xs text-white/50">{description}</p></div><a className="inline-flex text-sm text-[#C9A15A] underline" href={`data:text/plain;charset=utf-8,${encodeURIComponent(body)}`} download={`${title.toLowerCase().replaceAll(" ","-")}-starter-template.txt`}>Download starter template</a></Card>)}
          </div>
          {documentedStartups.length > 0 && <div className="space-y-3"><h3 className="text-sm font-medium">Founder-provided materials</h3>{documentedStartups.map((pitch) => <Card key={pitch.id} className="space-y-3 p-5"><div><h3 className="font-medium">{pitch.title}</h3><p className="mt-1 text-xs text-white/45">Shared by the founder</p></div><div className="flex flex-wrap gap-3 text-sm">{pitch.website_url && <a className="text-[#C9A15A] underline" href={pitch.website_url} target="_blank" rel="noreferrer">Website</a>}{pitch.pitch_deck_url && <a className="text-[#C9A15A] underline" href={pitch.pitch_deck_url} target="_blank" rel="noreferrer">Pitch deck</a>}{pitch.financials_url && <a className="text-[#C9A15A] underline" href={pitch.financials_url} target="_blank" rel="noreferrer">Financials</a>}{(pitch.documents || []).map((doc, index) => <a key={index} className="text-[#C9A15A] underline" href={doc.url} target="_blank" rel="noreferrer">{doc.title}</a>)}</div></Card>)}</div>}
          <p className="text-xs text-white/40">These are editable starting points, not legal advice, legal filings or binding agreements. Almeriq does not generate or sign legal contracts.</p>
        </section>

        
        )}

        {pageView === "deals" && (
        <section className="space-y-3">
          <div><h2 className="font-serif text-xl">Your deals & conversations</h2><p className="mt-1 text-sm text-white/50">Each request becomes a shared workspace once the founder responds.</p></div>
          {requests.length === 0 ? <Card className="border border-white/10 bg-white/2 p-6 text-sm text-white/50">You haven't expressed interest in a startup yet.</Card> : requests.filter((request) => !params.dealId || request.id === Number(params.dealId)).map((request) => {
            const pitch = request.pitch || startups.find((item) => item.id === request.pitch_id);
            const confirmed = Boolean(request.deal_confirmed_at && request.signature_data);
            return <Card key={request.id} className="space-y-3 border border-white/10 bg-white/2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{pitch?.title || `Startup pitch #${request.pitch_id}`}</p><p className="mt-1 text-xs text-white/50">Deal #{request.id}{request.amount != null ? ` · Initial indication: ${Number(request.amount).toLocaleString()}` : ""}</p>{pitch?.sector && <p className="mt-1 text-xs text-white/45">{pitch.sector} · {pitch.stage || "Stage not specified"}</p>}</div><span className={`rounded-full border px-3 py-1 text-xs ${confirmed ? "border-emerald-400/30 text-emerald-200" : "border-white/10 text-white/70"}`}>{confirmed ? "Demo confirmed" : String(request.status || "pending").replaceAll("_", " ")}</span></div>
              {request.investment_amount != null && <p className="text-sm text-white/65">Recorded amount: {Number(request.investment_amount).toLocaleString()} {request.ownership_percent != null ? `· Ownership entered: ${request.ownership_percent}%` : ""}</p>}
              {confirmed && <p className="text-xs text-emerald-200/80">Demo confirmation recorded {new Date(request.deal_confirmed_at).toLocaleDateString()}. No funds were transferred.</p>}
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => navigate(activeDealId === request.id ? "/investor/deals" : `/investor/deals/${request.id}`)}>{activeDealId === request.id ? "Back to pipeline" : "Open deal room"}</Button>{["accepted", "in_discussion", "invested"].includes(request.status) && <Button size="sm" variant="ghost" onClick={() => openConversation(request.id)}>Message founder</Button>}{["accepted", "in_discussion", "invested"].includes(request.status) && !confirmed && <Button size="sm" onClick={() => beginPortfolioEdit(request)}>Continue deal confirmation</Button>}</div>
              {activeDealId === request.id && <div className="grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
                <div className="space-y-2"><h3 className="text-sm font-medium">Opportunity overview</h3><p className="text-sm text-white/65">{pitch?.summary || "The founder has not added a company summary."}</p><p className="text-xs text-white/45">{[pitch?.location, pitch?.sector, pitch?.stage].filter(Boolean).join(" · ")}</p>{pitch?.traction && <p className="text-sm text-white/55">Traction: {pitch.traction}</p>}{pitch?.team_summary && <p className="text-sm text-white/55">Team: {pitch.team_summary}</p>}{pitch?.ask_amount != null && <p className="text-sm text-white/55">Funding ask: {Number(pitch.ask_amount).toLocaleString()}</p>}</div>
                <div className="space-y-2"><h3 className="text-sm font-medium">Deal documents</h3><div className="flex flex-wrap gap-3 text-sm">{pitch?.website_url && <a className="text-[#C9A15A] underline" href={pitch.website_url} target="_blank" rel="noreferrer">Website</a>}{pitch?.pitch_deck_url && <a className="text-[#C9A15A] underline" href={pitch.pitch_deck_url} target="_blank" rel="noreferrer">Pitch deck</a>}{pitch?.financials_url && <a className="text-[#C9A15A] underline" href={pitch.financials_url} target="_blank" rel="noreferrer">Financials</a>}{(pitch?.documents || []).map((doc,index) => <a key={index} className="text-[#C9A15A] underline" href={doc.url} target="_blank" rel="noreferrer">{doc.title}</a>)}</div><p className="text-xs text-white/40">Use the starter NDA, Founder Agreement and Term Sheet resources above as editable discussion drafts.</p><p className="text-xs text-white/40">Deal terms should be agreed directly by both parties and reviewed by qualified counsel.</p></div>
              </div>}
              {activeDealId === request.id && <div className="space-y-2 border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium">Deal activity</h3>
                <ol className="space-y-2 text-xs text-white/55">
                  {request.created_at && <li><span className="text-white/80">Interest submitted</span> · {new Date(request.created_at).toLocaleString()}</li>}
                  {request.updated_at && request.updated_at !== request.created_at && <li><span className="text-white/80">Deal record updated</span> · {new Date(request.updated_at).toLocaleString()}</li>}
                  {request.deal_confirmed_at && <li><span className="text-white/80">Investor demo confirmation recorded</span> · {new Date(request.deal_confirmed_at).toLocaleString()}</li>}
                </ol>
                <p className="text-xs text-white/35">This timeline reflects timestamps stored on the deal record, not a verified financial transaction history.</p>
              </div>}
            </Card>;
          })}
        </section>

        )}

                {editingInvestment && <Card className="space-y-4 border border-[#C9A15A]/30 p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-[#C9A15A]">Demo deal flow · Step {confirmationStep} of 5</p><h2 className="mt-1 font-serif text-xl">{confirmationStep === 5 ? "Deal confirmation complete" : "Confirm investment details"}</h2></div><Button size="sm" variant="ghost" onClick={() => setEditingInvestment(null)}>Close</Button></div>
          <div className="grid grid-cols-5 gap-1" aria-label="Deal confirmation progress">{[1,2,3,4,5].map((step) => <div key={step} className={`h-1.5 rounded-full ${step <= confirmationStep ? "bg-[#C9A15A]" : "bg-white/10"}`} />)}</div>
          {confirmationStep === 1 && <div className="space-y-4"><div><h3 className="font-medium">1. Choose a payment method</h3><p className="mt-1 text-sm text-white/50">This only selects a method for the demo. No credentials or payment details are collected.</p></div><div className="grid grid-cols-2 gap-2">{[["paypal","PayPal"],["mastercard","Mastercard"],["visa","Visa"],["mpesa","M-Pesa"]].map(([value,label]) => <button type="button" key={value} onClick={() => setPortfolioForm((form) => ({...form,payment_method:value}))} className={`rounded-lg border p-4 text-left text-sm ${portfolioForm.payment_method === value ? "border-[#C9A15A] bg-[#C9A15A]/10 text-[#E8D6A8]" : "border-white/10 bg-white/5 text-white"}`}>{label}{portfolioForm.payment_method === value && <span className="ml-2 text-xs">Selected</span>}</button>)}</div><div className="flex justify-end"><Button disabled={!portfolioForm.payment_method} onClick={() => setConfirmationStep(2)}>Continue</Button></div></div>}
          {confirmationStep === 2 && <div className="space-y-4"><div><h3 className="font-medium">2. Enter investment amount</h3><p className="mt-1 text-sm text-white/50">Enter the amount agreed for this demo deal record.</p></div><label className="block space-y-1 text-sm"><span>Investment amount</span><Input type="number" min="0.01" step="0.01" required value={portfolioForm.investment_amount} onChange={(event) => setPortfolioForm((form) => ({ ...form, investment_amount: event.target.value }))} placeholder="Enter amount" /></label><label className="block space-y-1 text-sm"><span>Ownership percentage (optional)</span><Input type="number" min="0" max="100" step="0.0001" value={portfolioForm.ownership_percent} onChange={(event) => setPortfolioForm((form) => ({ ...form, ownership_percent: event.target.value }))} /></label><div className="flex justify-between"><Button variant="ghost" onClick={() => setConfirmationStep(1)}>Back</Button><Button disabled={!Number.isFinite(Number(portfolioForm.investment_amount)) || Number(portfolioForm.investment_amount) <= 0} onClick={() => setConfirmationStep(3)}>Review amount</Button></div></div>}
          {confirmationStep === 3 && <div className="space-y-4"><div><h3 className="font-medium">3. Review and confirm details</h3><p className="mt-1 text-sm text-white/50">Check the information before signing.</p></div><div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm"><div className="flex justify-between gap-3 py-2"><span className="text-white/50">Startup</span><strong>{editingInvestment.pitch?.title || startups.find((item) => item.id === editingInvestment.pitch_id)?.title || `Pitch #${editingInvestment.pitch_id}`}</strong></div><div className="flex justify-between gap-3 border-t border-white/10 py-2"><span className="text-white/50">Amount</span><strong>{Number(portfolioForm.investment_amount).toLocaleString()}</strong></div><div className="flex justify-between gap-3 border-t border-white/10 py-2"><span className="text-white/50">Payment method</span><strong className="capitalize">{portfolioForm.payment_method}</strong></div><div className="flex justify-between gap-3 border-t border-white/10 py-2"><span className="text-white/50">Ownership</span><strong>{portfolioForm.ownership_percent ? `${portfolioForm.ownership_percent}%` : "Not specified"}</strong></div></div><p className="text-xs text-amber-200/80">This is a simulation only. It does not charge a card, initiate M-Pesa, transfer funds or issue shares.</p><div className="flex justify-between"><Button variant="ghost" onClick={() => setConfirmationStep(2)}>Back</Button><Button onClick={() => setConfirmationStep(4)}>Confirm details & sign</Button></div></div>}
          {confirmationStep === 4 && <div className="space-y-3"><div><h3 className="font-medium">4. Digital signature</h3><p className="mt-1 text-sm text-white/50">Draw your name below to confirm that you reviewed this demo record.</p></div>{editingInvestment.signature_data && !portfolioForm.signature_data && <img src={editingInvestment.signature_data} alt="Previously saved deal signature" className="max-h-24 rounded border border-white/10 bg-black/20 p-2" />}<canvas ref={signatureCanvasRef} width={640} height={160} onPointerDown={handleSignaturePointerDown} onPointerMove={handleSignaturePointerMove} onPointerUp={() => { const canvas = signatureCanvasRef.current; if (canvas) setPortfolioForm((form) => ({ ...form, signature_data: canvas.toDataURL("image/png") })); }} className="h-32 w-full touch-none rounded-lg border border-white/20 bg-black/20" /><div className="flex flex-wrap justify-between gap-2"><Button type="button" size="sm" variant="ghost" onClick={clearSignature}>Clear signature</Button><div className="flex gap-2"><Button variant="ghost" onClick={() => setConfirmationStep(3)}>Back</Button><Button disabled={!portfolioForm.signature_data && !editingInvestment.signature_data} onClick={(event) => savePortfolio({ event, editingInvestment, portfolioForm, setEditingInvestment, setConfirmationStep })}>Complete demo confirmation</Button></div></div><p className="text-xs text-white/40">Your signature is saved as part of the investor-reported record. It is not a legally executed investment agreement.</p></div>}
          {confirmationStep === 5 && <div className="space-y-3"><p className="text-emerald-200">The demo confirmation has been saved to your portfolio.</p><div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm"><p><strong>Startup:</strong> {editingInvestment.pitch?.title || startups.find((item) => item.id === editingInvestment.pitch_id)?.title || `Pitch #${editingInvestment.pitch_id}`}</p><p className="mt-1"><strong>Recorded amount:</strong> {Number(editingInvestment.investment_amount || 0).toLocaleString()}</p><p className="mt-1"><strong>Reference:</strong> ALM-DEMO-{String(editingInvestment.id).padStart(6,"0")}</p><p className="mt-1"><strong>Method:</strong> {String(editingInvestment.payment_method || "").toUpperCase()}</p></div><p className="text-xs text-white/45">No funds were charged or transferred. This reference identifies a simulated confirmation only.</p><div className="flex justify-end"><Button onClick={() => setEditingInvestment(null)}>Return to deal room</Button></div></div>}
        </Card>}
        <p className="text-xs text-white/40">Expressing interest starts a conversation only. Recording an investment is a manual portfolio entry; Almeriq does not transfer funds or create a binding investment.</p>
      </div>
    </div>
  );
}
