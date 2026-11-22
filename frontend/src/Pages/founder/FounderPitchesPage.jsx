import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/client";
import { Button, Card, Input } from "../../components/ui";
import { startInvestmentConversationApi } from "../../lib/api/conversations";
import { executeAiToolApi } from "../../lib/api/founder";

const EMPTY = { title: "", summary: "", sector: "", stage: "", ask_amount: "", location: "", target_check_size: "", website_url: "", pitch_deck_url: "", financials_url: "", traction: "", team_summary: "" };

export default function FounderPitchesPage() {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [documentsText, setDocumentsText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatePitchId, setUpdatePitchId] = useState("");
  const [updatePeriod, setUpdatePeriod] = useState("");
  const [updateHighlights, setUpdateHighlights] = useState("");
  const [updateChallenges, setUpdateChallenges] = useState("");
  const [updateKpis, setUpdateKpis] = useState("");
  const [updateAsks, setUpdateAsks] = useState("");
  const [investorUpdateDraft, setInvestorUpdateDraft] = useState("");
  const [draftingUpdate, setDraftingUpdate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pitchResponse, requestResponse] = await Promise.all([
        apiClient.get("/api/founder/pitches"),
        apiClient.get("/api/founder/investment-requests"),
      ]);
      const pitchData = pitchResponse.data;
      setPitches(Array.isArray(pitchData) ? pitchData : pitchData.items || []);
      setRequests(requestResponse.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load your pitches.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const reset = () => { setForm(EMPTY); setDocumentsText(""); setEditingId(null); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    const amount = form.ask_amount === "" ? null : Number(form.ask_amount);
    if (!form.title.trim() || (amount !== null && (!Number.isFinite(amount) || amount < 0))) {
      setError("Enter a pitch title and a valid non-negative funding ask."); setSaving(false); return;
    }
    const documents = documentsText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [title, ...urlParts] = line.split("|");
      return { title: title.trim(), url: urlParts.join("|").trim() };
    }).filter((item) => item.title && item.url);
    const payload = {
      title: form.title.trim(), summary: form.summary.trim() || null,
      sector: form.sector.trim() || null, stage: form.stage.trim() || null, ask_amount: amount,
      location: form.location.trim() || null, target_check_size: form.target_check_size === "" ? null : Number(form.target_check_size), website_url: form.website_url.trim() || null,
      pitch_deck_url: form.pitch_deck_url.trim() || null, financials_url: form.financials_url.trim() || null,
      traction: form.traction.trim() || null, team_summary: form.team_summary.trim() || null,
      documents,
    };
    try {
      if (editingId) await apiClient.put(`/api/founder/pitches/${editingId}`, payload);
      else await apiClient.post("/api/founder/pitches", payload);
      reset(); setNotice(editingId ? "Pitch updated." : "Pitch published to investor discovery."); await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save this pitch.");
    } finally { setSaving(false); }
  };

  const edit = (pitch) => {
    setEditingId(pitch.id);
    setForm({ ...EMPTY, title: pitch.title || "", summary: pitch.summary || "", sector: pitch.sector || "", stage: pitch.stage || "", ask_amount: pitch.ask_amount ?? "", location: pitch.location || "", target_check_size: pitch.target_check_size ?? "", website_url: pitch.website_url || "", pitch_deck_url: pitch.pitch_deck_url || "", financials_url: pitch.financials_url || "", traction: pitch.traction || "", team_summary: pitch.team_summary || "" });
    setDocumentsText((pitch.documents || []).map((item) => item.title + " | " + item.url).join("\n"));
    setNotice(""); setError("");
  };

  const generateInvestorUpdate = async () => {
    const pitch = pitches.find((item) => String(item.id) === String(updatePitchId));
    if (!pitch) { setError("Choose a startup pitch first."); return; }
    setDraftingUpdate(true); setError(""); setNotice("");
    try {
      const response = await executeAiToolApi({
        tool_key: "investor_update", idea: pitch.title, customer: "Current investors", location: pitch.location || "",
        problem: pitch.summary || "", solution: pitch.traction || "",
        extra_params: { period: updatePeriod || "Not specified", sector: pitch.sector, stage: pitch.stage, company_summary: pitch.summary, traction_so_far: pitch.traction, team: pitch.team_summary, founder_highlights: updateHighlights, challenges: updateChallenges, kpis: updateKpis, investor_asks: updateAsks },
      });
      const result = response.result || {};
      setInvestorUpdateDraft(result.full_email || [result.subject, ...(result.highlights || []), ...(result.lowlights || []), ...(result.asks || [])].join("\n"));
      setNotice("Investor update draft generated. Check every metric and statement before sending.");
    } catch (err) { setError(err.message || "Unable to draft the investor update."); }
    finally { setDraftingUpdate(false); }
  };

  const copyInvestorUpdate = async () => {
    if (!investorUpdateDraft) return;
    try { await navigator.clipboard.writeText(investorUpdateDraft); setNotice("Investor update copied."); }
    catch { setError("Clipboard access was blocked. Select and copy the draft manually."); }
  };
  const openConversation = async (requestId) => {
    try {
      const conversation = await startInvestmentConversationApi(requestId);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to open this conversation.");
    }
  };

  const updateRequest = async (requestId, status) => {
    setError(""); setNotice("");
    try {
      const { data } = await apiClient.patch(`/api/founder/investment-requests/${requestId}`, { status });
      setRequests((items) => items.map((item) => item.id === requestId ? { ...item, ...data } : item));
      setNotice(`Investor request marked ${status.replaceAll("_", " ")}.`);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update this investor request.");
    }
  };

  const remove = async (pitchId) => {
    if (!window.confirm("Delete this startup pitch?")) return;
    setError(""); setNotice("");
    try {
      await apiClient.delete(`/api/founder/pitches/${pitchId}`);
      if (editingId === pitchId) reset();
      setPitches((items) => items.filter((item) => item.id !== pitchId));
      setNotice("Pitch deleted.");
    } catch (err) { setError(err.response?.data?.detail || "Unable to delete this pitch."); }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-5xl space-y-6">
        <header><p className="text-xs uppercase tracking-widest text-gold">Founder workspace</p><h1 className="mt-2 font-serif text-3xl">Fundraising pitches</h1><p className="mt-2 text-sm text-white/60">Publish a concise startup profile for investors to discover.</p></header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-serif text-xl">{editingId ? "Edit pitch" : "Create a pitch"}</h2>{editingId && <Button variant="ghost" onClick={reset}>Cancel edit</Button>}</div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2"><span className="text-sm">Startup / pitch title</span><Input name="title" value={form.title} onChange={update} maxLength={200} required placeholder="Company or product name" /></label>
            <label className="block space-y-2"><span className="text-sm">Summary</span><textarea name="summary" value={form.summary} onChange={update} rows={4} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm text-text outline-none focus:border-gold" placeholder="Problem, solution, traction and what you're building." /></label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2"><span className="text-sm">Sector</span><Input name="sector" value={form.sector} onChange={update} placeholder="Fintech" /></label>
              <label className="block space-y-2"><span className="text-sm">Stage</span><Input name="stage" value={form.stage} onChange={update} placeholder="Pre-seed" /></label>
              <label className="block space-y-2"><span className="text-sm">Funding ask</span><Input name="ask_amount" type="number" min="0" step="0.01" value={form.ask_amount} onChange={update} placeholder="Optional amount" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2"><span className="text-sm">Location / market</span><Input name="location" value={form.location} onChange={update} placeholder="Nairobi, Kenya / East Africa" /></label>
              <label className="block space-y-2"><span className="text-sm">Target investor check size</span><Input name="target_check_size" type="number" min="0" step="0.01" value={form.target_check_size} onChange={update} placeholder="Typical individual ticket" /></label>
              <label className="block space-y-2"><span className="text-sm">Website</span><Input name="website_url" value={form.website_url} onChange={update} placeholder="https://…" /></label>
              <label className="block space-y-2"><span className="text-sm">Pitch deck URL</span><Input name="pitch_deck_url" value={form.pitch_deck_url} onChange={update} placeholder="https://…" /></label>
              <label className="block space-y-2"><span className="text-sm">Financials / data room URL</span><Input name="financials_url" value={form.financials_url} onChange={update} placeholder="https://…" /></label>
            </div>
            <label className="block space-y-2"><span className="text-sm">Traction</span><textarea name="traction" value={form.traction} onChange={update} rows={3} maxLength={3000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm" placeholder="Customers, revenue, growth, pilots or milestones." /></label>
            <label className="block space-y-2"><span className="text-sm">Team summary</span><textarea name="team_summary" value={form.team_summary} onChange={update} rows={3} maxLength={3000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm" placeholder="Who is building this and why are they suited to it?" /></label>
            <label className="block space-y-2"><span className="text-sm">Additional pitch documents (one per line: title | URL)</span><textarea value={documentsText} onChange={(event) => setDocumentsText(event.target.value)} rows={3} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm" placeholder="Product demo | https://…&#10;Market research | https://…" /></label>
            <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Update pitch" : "Publish pitch"}</Button></div>
          </form>
        </Card>
        <section className="space-y-3"><h2 className="font-serif text-xl">Your published pitches</h2>
          {loading ? <p className="text-sm text-white/50">Loading pitches…</p> : pitches.length === 0 ? <Card className="p-6 text-sm text-white/50">You haven't published a startup pitch yet.</Card> : pitches.map((pitch) => (
            <Card key={pitch.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0 flex-1"><h3 className="font-medium">{pitch.title}</h3><p className="mt-1 text-sm text-white/60">{pitch.sector || "Sector not set"} · {pitch.stage || "Stage not set"}{pitch.ask_amount != null ? ` · Ask: ${pitch.ask_amount}` : ""}</p><p className="mt-2 line-clamp-2 text-sm text-white/50">{pitch.summary || "No summary added."}</p></div>
              <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => edit(pitch)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(pitch.id)}>Delete</Button></div>
            </Card>
          ))}
        </section>
        <section className="space-y-3">
          <h2 className="font-serif text-xl">Investor interest</h2>
          {requests.length === 0 ? <Card className="p-6 text-sm text-white/50">No investors have expressed interest yet.</Card> : requests.map((request) => {
            const pitch = pitches.find((item) => item.id === request.pitch_id);
            return <Card key={request.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div><p className="font-medium">{pitch?.title || `Pitch #${request.pitch_id}`}</p><p className="mt-1 text-xs text-white/50">{request.investor_name || `Investor #${request.investor_id}`}{request.amount != null ? ` · Indicative amount: ${request.amount}` : ""}</p>{request.investor_profile && <p className="mt-2 max-w-xl text-xs text-white/55">{[request.investor_profile.investor_type, request.investor_profile.investment_focus, request.investor_profile.preferred_sectors?.join(", "), request.investor_profile.preferred_stages?.join(", "), request.investor_profile.geographies?.join(", "), request.investor_profile.check_size ? `Typical check: ${request.investor_profile.check_size}` : null, request.investor_profile.lead_follow_preference ? `Prefers to ${request.investor_profile.lead_follow_preference}` : null, request.investor_profile.accreditation_status ? `Accreditation: ${request.investor_profile.accreditation_status}` : null, request.investor_profile.location].filter(Boolean).join(" · ")}</p>}{request.investor_profile?.about && <p className="mt-1 max-w-xl text-xs text-white/45">{request.investor_profile.about}</p>{request.investor_profile?.verification_url && <a className="mt-1 block text-xs text-[#C9A15A] underline" href={request.investor_profile.verification_url} target="_blank" rel="noreferrer">Investor verification link</a>}{request.investor_profile?.notable_investments && <p className="mt-1 max-w-xl text-xs text-white/45">Notable investments: {request.investor_profile.notable_investments}</p>}{request.investor_profile?.companies_backed != null && <p className="mt-1 max-w-xl text-xs text-white/45">Track record: {request.investor_profile.companies_backed} companies backed · {request.investor_profile.exits ?? 0} exits · {request.investor_profile.years_investing ?? "—"} years investing</p>}{request.investor_profile?.assets_under_management && <p className="mt-1 max-w-xl text-xs text-white/45">AUM: {request.investor_profile.assets_under_management}</p>}{request.investor_profile?.time_commitment && <p className="mt-1 max-w-xl text-xs text-white/45">Time commitment: {request.investor_profile.time_commitment}</p>}{request.investor_profile?.contact_preference && <p className="mt-1 max-w-xl text-xs text-white/45">Contact preference: {request.investor_profile.contact_preference}</p>}{request.investor_profile?.contact_formats?.length > 0 && <p className="mt-1 max-w-xl text-xs text-white/45">First contact: {request.investor_profile.contact_formats.join(", ")}</p>}}{request.investor_profile?.track_record && <p className="mt-1 max-w-xl text-xs text-white/45">Track record: {request.investor_profile.track_record}</p>}{request.investor_profile?.value_add && <p className="mt-1 max-w-xl text-xs text-white/45">Founder support: {request.investor_profile.value_add}</p>}{request.status === "invested" && <p className="mt-1 text-xs text-emerald-200">Recorded investment: {Number(request.investment_amount || 0).toLocaleString()}</p>}<p className="mt-1 text-xs capitalize text-gold">{String(request.status || "pending").replaceAll("_", " ")}</p></div>
              <div className="flex flex-wrap gap-2">{request.status === "pending" && <><Button size="sm" onClick={() => updateRequest(request.id, "accepted")}>Accept</Button><Button size="sm" variant="ghost" onClick={() => updateRequest(request.id, "declined")}>Decline</Button><Button size="sm" variant="ghost" onClick={() => updateRequest(request.id, "in_discussion")}>Discuss</Button></>}{["accepted", "in_discussion", "invested"].includes(request.status) && <Button size="sm" variant="ghost" onClick={() => openConversation(request.id)}>Message investor</Button>}</div>
            </Card>;
          })}
        </section>
      </div>
    </main>
  );
}
