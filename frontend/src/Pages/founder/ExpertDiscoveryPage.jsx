import { useEffect, useState } from "react";
import { apiClient } from "../../lib/client";
import { Button, Card, Input } from "../../components/ui";

export default function ExpertDiscoveryPage() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    apiClient.get("/api/experts").then(({ data }) => {
      if (active) setExperts(data?.items || []);
    }).catch((err) => {
      if (active) setError(err.response?.data?.detail || "Unable to load experts.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = experts.filter((expert) => {
    const haystack = [expert.headline, expert.bio, expert.location, ...(expert.expertise || [])].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const requestAdvice = async (event) => {
    event.preventDefault();
    if (!selected || subject.trim().length < 3 || description.trim().length < 10) {
      setError("Add a subject and a description of at least 10 characters."); return;
    }
    const amount = budget === "" ? null : Number(budget);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) { setError("Budget must be a valid non-negative amount."); return; }
    setSending(true); setError(""); setNotice("");
    try {
      await apiClient.post(`/api/experts/${selected.user_id}/requests`, { subject: subject.trim(), description: description.trim(), budget: amount });
      setNotice(`Your advisory request was sent to ${selected.headline || "the expert"}.`);
      setSelected(null); setSubject(""); setDescription(""); setBudget("");
    } catch (err) { setError(err.response?.data?.detail || "Unable to send your request."); }
    finally { setSending(false); }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-5xl space-y-6">
        <header><p className="text-xs uppercase tracking-widest text-gold">Founder workspace</p><h1 className="mt-2 font-serif text-3xl">Find an expert</h1><p className="mt-2 text-sm text-white/60">Find people who can help move your venture forward.</p></header>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search expertise, location or keywords…" />
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
        {loading ? <p className="text-sm text-white/50">Loading experts…</p> : visible.length === 0 ? <Card className="p-6 text-sm text-white/50">No active expert profiles match that search.</Card> : <div className="grid gap-4 md:grid-cols-2">{visible.map((expert) => (
          <Card key={expert.id} className="space-y-3 p-5">
            <div><h2 className="font-serif text-xl">{expert.headline || "Independent expert"}</h2><p className="mt-1 text-xs text-gold">{expert.expertise?.join(" · ") || "Expertise not listed"}</p></div>
            <p className="text-sm text-white/65">{expert.bio || "No bio provided."}</p>
            <p className="text-xs text-white/45">{expert.location || "Location not set"} · {expert.years_experience ?? "—"} years experience{expert.hourly_rate != null ? ` · Rate: ${expert.hourly_rate}` : ""}</p>
            {expert.availability && <p className="text-xs text-white/50">Availability: {expert.availability}</p>}
            <Button size="sm" onClick={() => { setSelected(expert); setError(""); setNotice(""); }}>Request advice</Button>
          </Card>
        ))}</div>}
        {selected && <Card className="border border-gold/30 p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-serif text-xl">Request advice from {selected.headline || "this expert"}</h2><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button></div>
          <form onSubmit={requestAdvice} className="space-y-4">
            <label className="block space-y-2"><span className="text-sm">What do you need help with?</span><Input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} placeholder="e.g. Review our fundraising strategy" required /></label>
            <label className="block space-y-2"><span className="text-sm">Describe the request</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm text-text outline-none focus:border-gold" placeholder="Share context, goals and the kind of help you need." required /></label>
            <label className="block space-y-2"><span className="text-sm">Indicative budget (optional)</span><Input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Amount" /></label>
            <div className="flex justify-end"><Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send advisory request"}</Button></div>
          </form>
        </Card>}
      </div>
    </main>
  );
}
