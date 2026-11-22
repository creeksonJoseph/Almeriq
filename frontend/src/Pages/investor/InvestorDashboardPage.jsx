import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../components/ui";
import {
  getInvestorProfileApi, listInvestorStartupsApi, listInvestorPortfolioApi,
  createInvestmentApi,
} from "../../lib/api";

export default function InvestorDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [startups, setStartups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPitch, setBusyPitch] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileResult, startupResult, requestResult] = await Promise.all([
        getInvestorProfileApi(),
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
          <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-xl">Startup discovery</h2><span className="text-xs text-white/40">{startups.length} pitches</span></div>
          {startups.length === 0 ? <Card className="border border-white/10 bg-white/2 p-6 text-sm text-white/50">No startup pitches are available yet.</Card> : startups.map((pitch) => (
            <Card key={pitch.id} className="border border-white/10 bg-white/2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1"><h3 className="font-medium text-white">{pitch.title}</h3><p className="mt-1 text-xs text-[#C9A15A]">{pitch.sector || "Sector not specified"} · {pitch.stage || "Stage not specified"}</p><p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{pitch.summary || "The founder hasn't added a summary yet."}</p>{pitch.ask_amount != null && <p className="mt-3 text-sm text-white/60">Funding ask: {Number(pitch.ask_amount).toLocaleString()}</p>}</div>
                <Button size="sm" disabled={requestedPitchIds.has(pitch.id) || busyPitch === pitch.id} onClick={() => expressInterest(pitch)}>{requestedPitchIds.has(pitch.id) ? "Interest sent" : busyPitch === pitch.id ? "Sending…" : "Express interest"}</Button>
              </div>
            </Card>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl">Your founder conversations</h2>
          {requests.length === 0 ? <Card className="border border-white/10 bg-white/2 p-6 text-sm text-white/50">You haven't expressed interest in a startup yet.</Card> : requests.map((request) => {
            const pitch = startups.find((item) => item.id === request.pitch_id);
            return <Card key={request.id} className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/2 p-4"><div><p className="font-medium">{pitch?.title || `Startup pitch #${request.pitch_id}`}</p><p className="mt-1 text-xs text-white/50">Request #{request.id}{request.amount != null ? ` · Indicative amount: ${request.amount}` : ""}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-white/70">{String(request.status || "pending").replaceAll("_", " ")}</span></Card>;
          })}
        </section>
        <p className="text-xs text-white/40">Expressing interest starts a conversation only. It does not transfer funds or create a binding investment.</p>
      </div>
    </div>
  );
}
