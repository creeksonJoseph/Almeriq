import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/client";
import { Button, Card, Input } from "../../components/ui";
import { startInvestmentConversationApi } from "../../lib/api/conversations";

const EMPTY = { title: "", summary: "", sector: "", stage: "", ask_amount: "" };

export default function FounderPitchesPage() {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
  const reset = () => { setForm(EMPTY); setEditingId(null); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    const amount = form.ask_amount === "" ? null : Number(form.ask_amount);
    if (!form.title.trim() || (amount !== null && (!Number.isFinite(amount) || amount < 0))) {
      setError("Enter a pitch title and a valid non-negative funding ask."); setSaving(false); return;
    }
    const payload = { title: form.title.trim(), summary: form.summary.trim() || null, sector: form.sector.trim() || null, stage: form.stage.trim() || null, ask_amount: amount };
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
    setForm({ title: pitch.title || "", summary: pitch.summary || "", sector: pitch.sector || "", stage: pitch.stage || "", ask_amount: pitch.ask_amount ?? "" });
    setNotice(""); setError("");
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
      setRequests((items) => items.map((item) => item.id === requestId ? data : item));
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
              <label className="block space-y-2"><span className="text-sm">Funding ask</span><Input name="ask_amount" value={form.ask_amount} onChange={update} placeholder="Optional amount" /></label>
            </div>
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
              <div><p className="font-medium">{pitch?.title || `Pitch #${request.pitch_id}`}</p><p className="mt-1 text-xs text-white/50">{request.investor_name || `Investor #${request.investor_id}`}{request.amount != null ? ` · Indicative amount: ${request.amount}` : ""}</p><p className="mt-1 text-xs capitalize text-gold">{String(request.status || "pending").replaceAll("_", " ")}</p></div>
              <div className="flex flex-wrap gap-2">{request.status === "pending" && <><Button size="sm" onClick={() => updateRequest(request.id, "accepted")}>Accept</Button><Button size="sm" variant="ghost" onClick={() => updateRequest(request.id, "declined")}>Decline</Button><Button size="sm" variant="ghost" onClick={() => updateRequest(request.id, "in_discussion")}>Discuss</Button></>}{["accepted", "in_discussion"].includes(request.status) && <Button size="sm" variant="ghost" onClick={() => openConversation(request.id)}>Message investor</Button>}</div>
            </Card>;
          })}
        </section>
      </div>
    </main>
  );
}
