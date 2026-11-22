import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../components/ui";
import {
  getInvestorProfileApi, listInvestorStartupsApi, listInvestorPortfolioApi,
  createInvestmentApi, updateInvestorPortfolioApi,
} from "../../lib/api";
import { startInvestmentConversationApi } from "../../lib/api/conversations";

export default function InvestorDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [startups, setStartups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPitch, setBusyPitch] = useState(null);
  const [startupQuery, setStartupQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({ investment_amount: "", current_value: "", ownership_percent: "", investment_date: "", notes: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileResult, startupResult, requestResult] = await Promise.all([
        getInvestorProfileApi().catch((err) => {
          if (err.status === 404) return null;
          throw err;
        }),
        listInvestorStartupsApi(),
        listInvestorPortfolioApi(),
      ]);
      setProfile(profileResult);
      setStartups(startupResult?.items || []);
      setRequests(requestResult?.items || []);
    } catch (err) {
      setError(err.message || "Unable to load your investor workspace.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openConversation = async (investmentId) => {
    try {
      const conversation = await startInvestmentConversationApi(investmentId);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      setError(err.message || "Unable to open this conversation.");
    }
  };

  const savePortfolio = async (event) => {
    event.preventDefault();
    if (!editingInvestment) return;
    setError(""); setNotice("");
    try {
      const updated = await updateInvestorPortfolioApi(editingInvestment.id, {
        investment_amount: Number(portfolioForm.investment_amount),
        current_value: portfolioForm.current_value === "" ? null : Number(portfolioForm.current_value),
        ownership_percent: portfolioForm.ownership_percent === "" ? null : Number(portfolioForm.ownership_percent),
        investment_date: portfolioForm.investment_date || null,
        notes: portfolioForm.notes.trim() || null,
      });
      setRequests((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setEditingInvestment(null);
      setNotice("Portfolio record saved. These are manually maintained figures; no funds were transferred.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to save this portfolio record.");
    }
  };

  const beginPortfolioEdit = (request) => {
    setEditingInvestment(request);
    setPortfolioForm({
      investment_amount: request.investment_amount ?? request.amount ?? "",
      current_value: request.current_value ?? "",
      ownership_percent: request.ownership_percent ?? "",
      investment_date: request.investment_date || "",
      notes: request.notes || "",
    });
  };

  const expressInterest = async (pitch) => {
    setBusyPitch(pitch.id); setError(""); setNotice("");
    try {
      const request = await createInvestmentApi({ pitch_id: pitch.id });
      setRequests((current) => [request, ...current]);
      setNotice(`Your interest in ${pitch.title} has been sent to the founder.`);
    } catch (err) {
      setError(err.message || "Unable to send your request.");
    } finally { setBusyPitch(null); }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white/60">Loading investor workspace…</div>;

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
  const visibleStartups = startups.filter((pitch) =>
    [pitch.title, pitch.summary, pitch.sector, pitch.stage, pitch.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(startupQuery.trim().toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-widest text-[#C9A15A]">Investor workspace</p><h1 className="mt-2 font-serif text-3xl">Investor Dashboard</h1><p className="mt-2 text-sm text-white/60">Discover startups and manage founder conversations.</p></div>
          <Button className="bg-[#C9A15A] text-[#111318] hover:bg-[#E8D6A8]" onClick={() => navigate("/investor/profile")}>{profile ? "Edit Profile" : "Complete Profile"}</Button>
        </header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
        {!profile?.firm_name && <Card className="border border-[#C9A15A]/20 bg-[#C9A15A]/5 p-4 text-sm text-white/70">Complete your investor profile so founders can understand your investment focus.</Card>}
        <section className="space-y-3">
          <h2 className="font-serif text-xl">Portfolio overview</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4"><p className="text-xs text-white/45">Recorded investments</p><p className="mt-2 text-2xl font-semibold">{investedItems.length}</p></Card>
            <Card className="p-4"><p className="text-xs text-white/45">Amount invested</p><p className="mt-2 text-2xl font-semibold">{totalInvested.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-xs text-white/45">Current value (valued positions)</p><p className="mt-2 text-2xl font-semibold">{currentPortfolioValue.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-xs text-white/45">ROI on valued positions</p><p className="mt-2 text-2xl font-semibold">{portfolioRoi == null ? "—" : portfolioRoi.toFixed(1) + "%"}</p></Card>
          </div>
          {projectedValue != null && <Card className="p-4"><p className="text-xs text-white/45">Illustrative 12-month value projection</p><p className="mt-2 text-xl font-semibold">{projectedValue.toLocaleString()}</p><p className="mt-1 text-xs text-white/45">Uses your self-entered {returnAssumption}% annual return assumption; not a forecast or guarantee.</p></Card>}
          {Object.keys(stageExposure).length > 0 && <Card className="p-4"><h3 className="font-medium">Portfolio stage exposure</h3><div className="mt-3 space-y-2">{Object.entries(stageExposure).map(([stage, amount]) => <div key={stage} className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="text-white/65">{stage}</span><span>{amount.toLocaleString()}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#C9A15A]" style={{ width: (amount / maxStageExposure * 100) + "%" }} /></div></div>)}</div><p className="mt-2 text-xs text-white/40">Stage exposure is a simple portfolio breakdown, not a formal risk rating.</p></Card>}
          <p className="text-xs text-white/40">Portfolio figures are manually recorded by you. Almeriq does not process or verify investment transfers.</p>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-xl">Startup discovery</h2><span className="text-xs text-white/40">{visibleStartups.length} pitches</span></div>
          <Input value={startupQuery} onChange={(event) => setStartupQuery(event.target.value)} placeholder="Search startups, sectors or stages…" />
          {startups.length === 0 ? <Card className="border border-white/10 bg-white/2 p-6 text-sm text-white/50">No startup pitches are available yet.</Card> : visibleStartups.length === 0 ? <Card className="border border-white/10 bg-white/2 p-6 text-sm text-white/50">No pitches match that search.</Card> : visibleStartups.map((pitch) => (
            <Card key={pitch.id} className="border border-white/10 bg-white/2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1"><h3 className="font-medium text-white">{pitch.title}</h3><p className="mt-1 text-xs text-[#C9A15A]">{pitch.sector || "Sector not specified"} · {pitch.stage || "Stage not specified"}</p><p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{pitch.summary || "The founder hasn't added a summary yet."}</p>{pitch.ask_amount != null && <p className="mt-3 text-sm text-white/60">Funding round ask: {Number(pitch.ask_amount).toLocaleString()}</p>}{pitch.target_check_size != null && <p className="mt-1 text-sm text-white/60">Target investor check: {Number(pitch.target_check_size).toLocaleString()}</p>}{pitch.match_score != null && <p className="mt-2 text-xs text-emerald-200">{pitch.match_score}% match · {(pitch.match_reasons || []).join(" · ")}</p>}{pitch.traction && <p className="mt-2 text-sm text-white/55">Traction: {pitch.traction}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs">{pitch.website_url && <a className="text-[#C9A15A] underline" href={pitch.website_url} target="_blank" rel="noreferrer">Website</a>}{pitch.pitch_deck_url && <a className="text-[#C9A15A] underline" href={pitch.pitch_deck_url} target="_blank" rel="noreferrer">Pitch deck</a>}{pitch.financials_url && <a className="text-[#C9A15A] underline" href={pitch.financials_url} target="_blank" rel="noreferrer">Financials</a>}{(pitch.documents || []).map((doc, index) => <a key={index} className="text-[#C9A15A] underline" href={doc.url} target="_blank" rel="noreferrer">{doc.title}</a>)}</div></div>
                <Button size="sm" disabled={requestedPitchIds.has(pitch.id) || busyPitch === pitch.id} onClick={() => expressInterest(pitch)}>{requestedPitchIds.has(pitch.id) ? "Interest sent" : busyPitch === pitch.id ? "Sending…" : "Express interest"}</Button>
              </div>
            </Card>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl">Your founder conversations & portfolio records</h2>
          {requests.length === 0 ? <Card className="border border-white/10 bg-white/2 p-6 text-sm text-white/50">You haven't expressed interest in a startup yet.</Card> : requests.map((request) => {
            const pitch = startups.find((item) => item.id === request.pitch_id);
            return <Card key={request.id} className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/2 p-4"><div><p className="font-medium">{request.pitch?.title || pitch?.title || `Startup pitch #${request.pitch_id}`}</p><p className="mt-1 text-xs text-white/50">Request #{request.id}{request.amount != null ? ` · Indicative amount: ${request.amount}` : ""}</p></div><div className="flex items-center gap-2"><span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-white/70">{String(request.status || "pending").replaceAll("_", " ")}</span>{["accepted", "in_discussion", "invested"].includes(request.status) && <Button size="sm" variant="ghost" onClick={() => openConversation(request.id)}>Message founder</Button>}{["accepted", "in_discussion", "invested"].includes(request.status) && <Button size="sm" variant="ghost" onClick={() => beginPortfolioEdit(request)}>{request.status === "invested" ? "Update portfolio" : "Record investment"}</Button>}</div></Card>;
          })}
        </section>
        {editingInvestment && <Card className="space-y-4 border border-[#C9A15A]/30 p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-xl">Record portfolio position</h2><Button size="sm" variant="ghost" onClick={() => setEditingInvestment(null)}>Close</Button></div>
          <form onSubmit={savePortfolio} className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm"><span>Amount invested</span><Input type="number" min="0.01" step="0.01" required value={portfolioForm.investment_amount} onChange={(event) => setPortfolioForm((form) => ({ ...form, investment_amount: event.target.value }))} /></label>
            <label className="space-y-1 text-sm"><span>Current position value</span><Input type="number" min="0" step="0.01" value={portfolioForm.current_value} onChange={(event) => setPortfolioForm((form) => ({ ...form, current_value: event.target.value }))} /></label>
            <label className="space-y-1 text-sm"><span>Ownership (%)</span><Input type="number" min="0" max="100" step="0.0001" value={portfolioForm.ownership_percent} onChange={(event) => setPortfolioForm((form) => ({ ...form, ownership_percent: event.target.value }))} /></label>
            <label className="space-y-1 text-sm"><span>Investment date</span><Input type="date" value={portfolioForm.investment_date} onChange={(event) => setPortfolioForm((form) => ({ ...form, investment_date: event.target.value }))} /></label>
            <label className="space-y-1 text-sm sm:col-span-2"><span>Notes</span><textarea value={portfolioForm.notes} onChange={(event) => setPortfolioForm((form) => ({ ...form, notes: event.target.value }))} rows={3} maxLength={3000} className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm" /></label>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit">Save portfolio record</Button></div>
          </form>
        </Card>}
        <p className="text-xs text-white/40">Expressing interest starts a conversation only. Recording an investment is a manual portfolio entry; Almeriq does not transfer funds or create a binding investment.</p>
      </div>
    </div>
  );
}
