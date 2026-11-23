import { useState } from "react";
import { useExpertDiscovery } from "../../hooks/useExpertDiscovery";
import { Button, Card, Input, Textarea, Skeleton, SkeletonText } from "../../components/ui";
import { useNavigate } from "react-router-dom";

export default function ExpertDiscoveryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [sending, setSending] = useState(false);
  const { experts, requests, expertsLoading, requestsLoading, error, notice, sendRequest, openConversation, setError } = useExpertDiscovery();

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
      await sendRequest(selected.user_id, { subject: subject.trim(), description: description.trim(), budget: amount });
      setSelected(null); setSubject(""); setDescription(""); setBudget("");
    } catch { /* The feature hook exposes the request error. */ }
    finally { setSending(false); }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-5xl space-y-6">
        <header><p className="text-xs uppercase tracking-widest text-gold">Founder workspace</p><h1 className="mt-2 font-serif text-3xl">Find an expert</h1><p className="mt-2 text-sm text-white/60">Find people who can help move your venture forward.</p></header>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search expertise, location or keywords…" />
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
        {expertsLoading ? <div className="grid gap-4 md:grid-cols-2" aria-busy="true">{[0, 1, 2, 3].map((item) => <Card key={item} className="space-y-3 p-5"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-3 w-1/3" /><SkeletonText lines={3} /><Skeleton className="h-9 w-28 rounded-xl" /></Card>)}</div> : visible.length === 0 ? <Card className="p-6 text-sm text-white/50">No active expert profiles match that search.</Card> : <div className="grid gap-4 md:grid-cols-2">{visible.map((expert) => (
          <Card key={expert.id} className="space-y-3 p-5">
            <div><h2 className="font-serif text-xl">{expert.headline || "Independent expert"}</h2><p className="mt-1 text-xs text-gold">{expert.expertise?.join(" · ") || "Expertise not listed"}</p></div>
            <p className="text-sm text-white/65">{expert.bio || "No bio provided."}</p>
            <p className="text-xs text-white/45">{expert.location || "Location not set"} · {expert.years_experience ?? "—"} years experience{expert.hourly_rate != null ? ` · Rate: ${expert.hourly_rate}` : ""}</p>
            {expert.availability && <p className="text-xs text-white/50">Availability: {expert.availability}</p>}
            <Button size="sm" onClick={() => { setSelected(expert); setError(""); setNotice(""); }}>Request advice</Button>
          </Card>
        ))}</div>}
        <section className="space-y-3">
          <h2 className="font-serif text-xl">Your advisory requests</h2>
          {requestsLoading ? <div className="space-y-3" aria-busy="true">{[0, 1].map((item) => <Card key={item} className="space-y-2 p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></Card>)}</div> : requests.length === 0 ? <Card className="p-5 text-sm text-white/50">You haven't contacted an expert yet.</Card> : requests.map((request) => {
            const expert = experts.find((item) => item.user_id === request.expert_id);
            return <Card key={request.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div><p className="font-medium">{request.subject}</p><p className="mt-1 text-xs text-white/50">{expert?.headline || `Expert #${request.expert_id}`} · <span className="capitalize">{request.status.replaceAll("_", " ")}</span></p></div>
              {["accepted", "completed"].includes(request.status) && <Button size="sm" onClick={async () => { try { const conversation = await openConversation(request.id); navigate(`/messages?conversation=${conversation.id}`); } catch (err) { setError(err.message || "Unable to open this conversation."); } }}>Open conversation</Button>}
            </Card>;
          })}
        </section>
        {selected && <Card className="border border-gold/30 p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-serif text-xl">Request advice from {selected.headline || "this expert"}</h2><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button></div>
          <form onSubmit={requestAdvice} className="space-y-4">
            <label className="block space-y-2"><span className="text-sm">What do you need help with?</span><Input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} placeholder="e.g. Review our fundraising strategy" required /></label>
            <label className="block space-y-2"><span className="text-sm">Describe the request</span><Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm text-text outline-none focus:border-gold" placeholder="Share context, goals and the kind of help you need." required /></label>
            <label className="block space-y-2"><span className="text-sm">Indicative budget (optional)</span><Input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Amount" /></label>
            <div className="flex justify-end"><Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send advisory request"}</Button></div>
          </form>
        </Card>}
      </div>
    </main>
  );
}
